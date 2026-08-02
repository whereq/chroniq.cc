"""SQLAlchemy models.

Importing every model here ensures they are registered on ``Base.metadata``
so Alembic autogenerate can see the full schema.
"""

from chroniq.models.availability import (
    AvailabilityOverride,
    AvailabilityRule,
    AvailabilitySchedule,
)
from chroniq.models.booking import Booking
from chroniq.models.calendar_connection import CalendarConnection
from chroniq.models.event_type import EventType
from chroniq.models.notification_log import NotificationLog
from chroniq.models.user_profile import UserProfile

__all__ = [
    "UserProfile",
    "EventType",
    "AvailabilitySchedule",
    "AvailabilityRule",
    "AvailabilityOverride",
    "Booking",
    "CalendarConnection",
    "NotificationLog",
]
