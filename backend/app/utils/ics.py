"""RFC5545 (iCalendar) invite builder for the booking scheduler.

Generates the .ics attachment sent on every booking confirmation/reschedule/cancel
email — this is what guarantees a working calendar invite even when the host has
never connected Google Calendar, or when a live Google Calendar API sync fails.
Outlook/Apple Mail/Google Calendar all parse METHOD:REQUEST/CANCEL + SEQUENCE to
correctly add, replace, or remove the event, independent of whatever the Google
Calendar API sync path did (see app/services/google_calendar.py).
"""

from __future__ import annotations

from datetime import datetime, timezone

from icalendar import Calendar, Event, vCalAddress, vText

from app.models.booking import BookingLocationType, BookingPage, ScheduledMeeting


def _meeting_description(meeting: ScheduledMeeting, booking_page: BookingPage) -> str:
    parts: list[str] = []
    if booking_page.location_type == BookingLocationType.GOOGLE_MEET:
        if meeting.google_meet_link:
            parts.append(f"Join Google Meet: {meeting.google_meet_link}")
        elif booking_page.fallback_meeting_note:
            parts.append(booking_page.fallback_meeting_note)
        else:
            parts.append("The organizer will share the video call link shortly.")
    elif booking_page.location_type == BookingLocationType.OFFLINE and booking_page.offline_address:
        maps_url = "https://www.google.com/maps/search/?api=1&query=" + booking_page.offline_address.replace(" ", "+")
        parts.append(f"Location: {booking_page.offline_address}\nMap: {maps_url}")
    elif booking_page.location_type == BookingLocationType.PHONE and booking_page.fallback_meeting_note:
        parts.append(f"Phone: {booking_page.fallback_meeting_note}")

    if meeting.meeting_notes:
        parts.append(meeting.meeting_notes)
    return "\n\n".join(parts)


def _meeting_location(meeting: ScheduledMeeting, booking_page: BookingPage) -> str:
    if booking_page.location_type == BookingLocationType.GOOGLE_MEET and meeting.google_meet_link:
        return meeting.google_meet_link
    if booking_page.location_type == BookingLocationType.OFFLINE and booking_page.offline_address:
        return booking_page.offline_address
    return booking_page.fallback_meeting_note or ""


def build_meeting_ics(
    meeting: ScheduledMeeting,
    booking_page: BookingPage,
    *,
    organizer_email: str,
    organizer_name: str,
    method: str = "REQUEST",
) -> bytes:
    """Builds a VCALENDAR with method REQUEST (create/update) or CANCEL.

    `meeting.sequence` must be incremented by the caller before calling this with an
    updated time or with method="CANCEL" — RFC5545 requires a higher SEQUENCE for
    calendar clients to recognize the message supersedes a prior invite.
    """
    cal = Calendar()
    cal.add("prodid", "-//Gravit//Booking Scheduler//EN")
    cal.add("version", "2.0")
    cal.add("method", method)

    event = Event()
    event.add("uid", f"{meeting.public_id}@gravit-booking")
    event.add("summary", f"{booking_page.title} with {meeting.client_name}")
    event.add("dtstart", meeting.start_time.astimezone(timezone.utc))
    event.add("dtend", meeting.end_time.astimezone(timezone.utc))
    event.add("dtstamp", datetime.now(timezone.utc))
    event.add("sequence", meeting.sequence)
    event.add("status", "CANCELLED" if method == "CANCEL" else "CONFIRMED")

    description = _meeting_description(meeting, booking_page)
    if description:
        event.add("description", description)
    location = _meeting_location(meeting, booking_page)
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
