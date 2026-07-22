"""RFC5545 (iCalendar) invite builder for Meetings.

Generates the .ics attachment sent on every meeting confirmation/reschedule/cancel
email — this is what guarantees a working calendar invite regardless of how the
meeting's location was set up. Outlook/Apple Mail/Google Calendar all parse
METHOD:REQUEST/CANCEL + SEQUENCE to correctly add, replace, or remove the event.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from icalendar import Calendar, Event, vCalAddress, vText

from app.models.booking import MeetingLocationType, ScheduledMeeting


def _meeting_description(meeting: ScheduledMeeting, *, join_link_override: Optional[str] = None) -> str:
    parts: list[str] = []
    if meeting.location_type == MeetingLocationType.GOOGLE_MEET:
        link = join_link_override or meeting.location_detail
        if link:
            parts.append(f"Join: {link}")
        else:
            parts.append("The organizer will share the video call link shortly.")
    elif meeting.location_type == MeetingLocationType.OFFLINE and meeting.location_detail:
        maps_url = "https://www.google.com/maps/search/?api=1&query=" + meeting.location_detail.replace(" ", "+")
        parts.append(f"Location: {meeting.location_detail}\nMap: {maps_url}")
    elif meeting.location_type == MeetingLocationType.PHONE and meeting.location_detail:
        parts.append(f"Phone: {meeting.location_detail}")

    if meeting.meeting_notes:
        parts.append(meeting.meeting_notes)
    return "\n\n".join(parts)


def _meeting_location(meeting: ScheduledMeeting, *, join_link_override: Optional[str] = None) -> str:
    if meeting.location_type == MeetingLocationType.GOOGLE_MEET and join_link_override:
        return join_link_override
    return meeting.location_detail or ""


def build_meeting_ics(
    meeting: ScheduledMeeting,
    *,
    organizer_email: str,
    organizer_name: str,
    method: str = "REQUEST",
    join_link_override: Optional[str] = None,
) -> bytes:
    """Builds a VCALENDAR with method REQUEST (create/update) or CANCEL.

    `meeting.sequence` must be incremented by the caller before calling this with an
    updated time or with method="CANCEL" — RFC5545 requires a higher SEQUENCE for
    calendar clients to recognize the message supersedes a prior invite.

    join_link_override, when given, replaces the raw location_detail Jitsi URL in
    the description/location fields (google_meet only) — callers pass the app's own
    join-gate link so calendar clients show/link to that instead (see
    app/services/booking.py's _join_link and get_meeting_join_info).
    """
    cal = Calendar()
    cal.add("prodid", "-//Gravit//Meetings//EN")
    cal.add("version", "2.0")
    cal.add("method", method)

    event = Event()
    event.add("uid", f"{meeting.public_id}@gravit-meetings")
    event.add("summary", meeting.meeting_title or f"Meeting with {meeting.client_name}")
    event.add("dtstart", meeting.start_time.astimezone(timezone.utc))
    event.add("dtend", meeting.end_time.astimezone(timezone.utc))
    event.add("dtstamp", datetime.now(timezone.utc))
    event.add("sequence", meeting.sequence)
    event.add("status", "CANCELLED" if method == "CANCEL" else "CONFIRMED")

    description = _meeting_description(meeting, join_link_override=join_link_override)
    if description:
        event.add("description", description)
    location = _meeting_location(meeting, join_link_override=join_link_override)
    if location:
        event.add("location", location)

    organizer = vCalAddress(f"MAILTO:{organizer_email}")
    organizer.params["cn"] = vText(organizer_name)
    event["organizer"] = organizer

    attendee = vCalAddress(f"MAILTO:{meeting.client_email}")
    attendee.params["cn"] = vText(meeting.client_name)
    attendee.params["role"] = vText("REQ-PARTICIPANT")
    attendee.params["partstat"] = vText("NEEDS-ACTION" if method != "CANCEL" else "DECLINED")
    attendee.params["rsvp"] = vText("TRUE" if method != "CANCEL" else "FALSE")
    event.add("attendee", attendee, encode=0)

    cal.add_component(event)
    return cal.to_ical()
