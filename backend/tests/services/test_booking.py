import uuid
from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash
from app.middleware.exceptions import BadRequestError, ConflictError
from app.models.booking import BookingAvailabilityException, BookingPage, MeetingStatus, ScheduledMeeting, CancelledBy
from app.models.organization import Organization
from app.models.user import User, UserRole
from app.schemas.booking import ScheduleMeetingRequest
from app.services import booking as booking_service
from app.utils.ics import build_meeting_ics


@pytest.fixture
async def host_setup(db_session: AsyncSession):
    """An org + host user + a 24/7-open booking page, so tests can book any
    'now + N hours' slot without depending on the real-world day of week."""
    org = Organization(name="Test Booking Org", subscription_status="trial")
    db_session.add(org)
    await db_session.flush()

    host = User(
        email="host@example.com",
        username="hostuser",
        full_name="Host User",
        hashed_password=get_password_hash("password123"),
        organization_id=org.id,
        role=UserRole.ADMIN,
        is_active=True,
        is_verified=True,
    )
    db_session.add(host)
    await db_session.flush()

    page = BookingPage(
        organization_id=org.id,
        user_id=host.id,
        slug="test-discovery-call",
        title="Discovery Call",
        duration_minutes=30,
        location_type="google_meet",
        timezone="UTC",
        availability={day: [["00:00", "23:59"]] for day in ("mon", "tue", "wed", "thu", "fri", "sat", "sun")},
        buffer_before_minutes=0,
        buffer_after_minutes=0,
        min_notice_minutes=0,
        max_advance_days=365,
    )
    db_session.add(page)
    await db_session.commit()
    await db_session.refresh(page)
    return org, host, page


def _future_slot(hours: int = 2) -> datetime:
    # Truncate to the minute so it aligns with the 30-min slot grid the test page uses.
    now = datetime.now(timezone.utc) + timedelta(hours=hours)
    return now.replace(minute=0, second=0, microsecond=0)


def _schedule_request(start_time: datetime, *, email: str = "client@example.com", key: str | None = None) -> ScheduleMeetingRequest:
    return ScheduleMeetingRequest(
        start_time=start_time,
        client_name="Ada Lovelace",
        client_email=email,
        attendee_timezone="UTC",
        meeting_notes="Let's discuss the project",
        idempotency_key=key or f"test-{uuid.uuid4()}",
    )


class TestCreateBooking:
    async def test_creates_meeting_and_lead(self, db_session: AsyncSession, host_setup):
        org, host, page = host_setup
        start = _future_slot()
        meeting = await booking_service.create_booking(db_session, page=page, payload=_schedule_request(start))
        await db_session.commit()

        assert meeting.status == MeetingStatus.SCHEDULED
        assert meeting.start_time == start
        assert meeting.end_time == start + timedelta(minutes=30)
        assert meeting.calendar_sync_status.value == "not_applicable"  # no Google connection for this host
        assert meeting.lead_id is not None
        assert meeting.manage_token

    async def test_idempotency_key_returns_existing_booking(self, db_session: AsyncSession, host_setup):
        org, host, page = host_setup
        start = _future_slot()
        key = f"idem-{uuid.uuid4()}"

        first = await booking_service.create_booking(db_session, page=page, payload=_schedule_request(start, key=key))
        await db_session.commit()
        second = await booking_service.create_booking(db_session, page=page, payload=_schedule_request(start, key=key))
        await db_session.commit()

        assert first.id == second.id
        count = await db_session.execute(select(ScheduledMeeting).where(ScheduledMeeting.idempotency_key == key))
        assert len(count.scalars().all()) == 1

    async def test_overlapping_slot_is_rejected(self, db_session: AsyncSession, host_setup):
        org, host, page = host_setup
        start = _future_slot()

        await booking_service.create_booking(db_session, page=page, payload=_schedule_request(start))
        await db_session.commit()

        with pytest.raises(ConflictError):
            await booking_service.create_booking(
                db_session, page=page, payload=_schedule_request(start, email="another@example.com")
            )

    async def test_min_notice_period_enforced(self, db_session: AsyncSession, host_setup):
        org, host, page = host_setup
        page.min_notice_minutes = 120
        await db_session.commit()

        too_soon = datetime.now(timezone.utc) + timedelta(minutes=10)
        with pytest.raises(BadRequestError):
            await booking_service.create_booking(db_session, page=page, payload=_schedule_request(too_soon))

    async def test_blocked_date_exception_is_rejected(self, db_session: AsyncSession, host_setup):
        org, host, page = host_setup
        start = _future_slot()
        db_session.add(BookingAvailabilityException(
            organization_id=org.id, booking_page_id=page.id, date=start.date(), is_blocked=True,
        ))
        await db_session.commit()

        with pytest.raises(BadRequestError):
            await booking_service.create_booking(db_session, page=page, payload=_schedule_request(start))


class TestCancelAndReschedule:
    async def test_cancel_is_idempotent(self, db_session: AsyncSession, host_setup):
        org, host, page = host_setup
        meeting = await booking_service.create_booking(db_session, page=page, payload=_schedule_request(_future_slot()))
        await db_session.commit()

        cancelled_once = await booking_service.cancel_booking(db_session, meeting=meeting, cancelled_by=CancelledBy.CLIENT, reason="can't make it")
        await db_session.commit()
        assert cancelled_once.status == MeetingStatus.CANCELLED

        cancelled_twice = await booking_service.cancel_booking(db_session, meeting=cancelled_once, cancelled_by=CancelledBy.CLIENT)
        assert cancelled_twice.status == MeetingStatus.CANCELLED  # no-op, doesn't raise

    async def test_reschedule_moves_meeting_and_bumps_sequence(self, db_session: AsyncSession, host_setup):
        org, host, page = host_setup
        meeting = await booking_service.create_booking(db_session, page=page, payload=_schedule_request(_future_slot()))
        await db_session.commit()
        original_sequence = meeting.sequence

        new_start = _future_slot(hours=5)
        rescheduled = await booking_service.reschedule_booking(db_session, meeting=meeting, new_start_time=new_start)
        await db_session.commit()

        assert rescheduled.start_time == new_start
        assert rescheduled.sequence == original_sequence + 1

    async def test_reschedule_into_conflict_is_rejected(self, db_session: AsyncSession, host_setup):
        org, host, page = host_setup
        first = await booking_service.create_booking(db_session, page=page, payload=_schedule_request(_future_slot(hours=2)))
        await db_session.commit()
        second = await booking_service.create_booking(
            db_session, page=page, payload=_schedule_request(_future_slot(hours=5), email="second@example.com")
        )
        await db_session.commit()

        with pytest.raises(ConflictError):
            await booking_service.reschedule_booking(db_session, meeting=second, new_start_time=first.start_time)


class TestIcsBuilder:
    def test_request_ics_contains_required_fields(self):
        page = BookingPage(
            id=1, organization_id=1, user_id=1, slug="x", title="Discovery Call", duration_minutes=30,
            location_type="offline", offline_address="221B Baker Street", timezone="UTC", availability={},
        )
        meeting = ScheduledMeeting(
            id=1, public_id=uuid.uuid4(), organization_id=1, booking_page_id=1,
            client_name="Ada Lovelace", client_email="client@example.com",
            start_time=datetime.now(timezone.utc), end_time=datetime.now(timezone.utc) + timedelta(minutes=30),
            host_timezone="UTC", attendee_timezone="UTC", sequence=0,
        )
        ics_bytes = build_meeting_ics(meeting, page, organizer_email="host@example.com", organizer_name="Host User", method="REQUEST")
        text = ics_bytes.decode("utf-8")

        assert "BEGIN:VEVENT" in text
        assert "METHOD:REQUEST" in text
        assert f"UID:{meeting.public_id}@gravit-booking" in text
        assert "ORGANIZER" in text and "host@example.com" in text
        assert "ATTENDEE" in text and "client@example.com" in text

    def test_cancel_ics_has_cancel_method_and_status(self):
        page = BookingPage(
            id=1, organization_id=1, user_id=1, slug="x", title="Discovery Call", duration_minutes=30,
            location_type="google_meet", timezone="UTC", availability={},
        )
        meeting = ScheduledMeeting(
            id=1, public_id=uuid.uuid4(), organization_id=1, booking_page_id=1,
            client_name="Ada Lovelace", client_email="client@example.com",
            start_time=datetime.now(timezone.utc), end_time=datetime.now(timezone.utc) + timedelta(minutes=30),
            host_timezone="UTC", attendee_timezone="UTC", sequence=1,
        )
        ics_bytes = build_meeting_ics(meeting, page, organizer_email="host@example.com", organizer_name="Host User", method="CANCEL")
        text = ics_bytes.decode("utf-8")

        assert "METHOD:CANCEL" in text
        assert "STATUS:CANCELLED" in text
        assert "SEQUENCE:1" in text
