from __future__ import annotations

import math
import random
from dataclasses import dataclass
from datetime import datetime, timedelta, time
from typing import Dict, List, Tuple


@dataclass
class ScheduleWindow:
    window_start: str
    window_end: str
    days: List[str]
    timezone: str
    per_day: int
    random_delay_minutes: Tuple[int, int]

    def as_time_bounds(self) -> Tuple[time, time]:
        start_hour, start_minute = map(int, self.window_start.split(":"))
        end_hour, end_minute = map(int, self.window_end.split(":"))
        return time(start_hour, start_minute), time(end_hour, end_minute)


class State:
    def __init__(self) -> None:
        self.contacts: Dict[str, dict] = {}
        self.campaigns: Dict[str, dict] = {}

    def sync_contacts_stub(self) -> List[dict]:
        """
        Placeholder for LinkedIn sync; returns a stable set of mock contacts.
        In production this would pull via LinkedIn API using stored OAuth tokens.
        """
        mock_contacts = [
            {
                "id": "urn:li:person:1",
                "first_name": "Alice",
                "last_name": "Nguyen",
                "headline": "VP Marketing at FintechCo",
                "company": "FintechCo",
                "industry": "FinTech",
                "location": "London, UK",
            },
            {
                "id": "urn:li:person:2",
                "first_name": "Bruno",
                "last_name": "Silva",
                "headline": "Founder at HealthAI",
                "company": "HealthAI",
                "industry": "HealthTech",
                "location": "Lisbon, Portugal",
            },
            {
                "id": "urn:li:person:3",
                "first_name": "Chen",
                "last_name": "Zhou",
                "headline": "Reporter at MediaNow",
                "company": "MediaNow",
                "industry": "Media",
                "location": "New York, USA",
            },
            {
                "id": "urn:li:person:4",
                "first_name": "Deepti",
                "last_name": "Patel",
                "headline": "CMO at RetailHub",
                "company": "RetailHub",
                "industry": "Ecommerce",
                "location": "Manchester, UK",
            },
        ]
        for contact in mock_contacts:
            self.contacts[contact["id"]] = contact
        return mock_contacts

    def segments(self) -> List[dict]:
        groups: Dict[Tuple[str, str], List[dict]] = {}
        for contact in self.contacts.values():
            key = (contact.get("industry") or "Unknown", contact.get("location") or "Unknown")
            groups.setdefault(key, []).append(contact)

        segments = []
        for (industry, location), contacts in groups.items():
            segments.append(
                {
                    "industry": industry,
                    "location": location,
                    "count": len(contacts),
                    "contacts": [c["id"] for c in contacts],
                }
            )
        segments.sort(key=lambda s: (s["industry"], s["location"]))
        return segments

    def save_campaign(self, name: str, schedule: List[dict]) -> str:
        campaign_id = f"camp-{len(self.campaigns) + 1:03d}"
        self.campaigns[campaign_id] = {
            "id": campaign_id,
            "name": name,
            "created_at": datetime.utcnow().isoformat(),
            "messages": schedule,
        }
        return campaign_id


def schedule_campaign_for_contacts(
    contacts: List[dict],
    window: ScheduleWindow,
    template: str,
) -> List[dict]:
    if not contacts:
        return []

    start_time, end_time = window.as_time_bounds()
    interval_minutes = _spread_within_window(window.per_day, start_time, end_time)
    scheduled = []
    day_names = window.days
    now = datetime.utcnow()
    day_offset = 0

    for chunk_start in range(0, len(contacts), window.per_day):
        day_contacts = contacts[chunk_start : chunk_start + window.per_day]
        day_name = day_names[day_offset % len(day_names)]
        base_time = _next_weekday_at(now, day_name, start_time) + timedelta(days=7 * (day_offset // len(day_names)))

        for idx, contact in enumerate(day_contacts):
            jitter = random.randint(*window.random_delay_minutes)
            send_time = base_time + timedelta(minutes=interval_minutes * idx + jitter)
            personalized = template.format(
                first_name=contact.get("first_name", ""),
                last_name=contact.get("last_name", ""),
                company=contact.get("company", ""),
            )
            scheduled.append(
                {
                    "contact_id": contact["id"],
                    "send_at": send_time.isoformat(),
                    "body": personalized,
                }
            )
        day_offset += 1

    return scheduled


def _next_weekday_at(base: datetime, target_day: str, target_time: time) -> datetime:
    weekday_map = {"Mon": 0, "Tue": 1, "Wed": 2, "Thu": 3, "Fri": 4, "Sat": 5, "Sun": 6}
    if target_day not in weekday_map:
        raise ValueError(f"Invalid day name: {target_day}")
    target_weekday = weekday_map[target_day]
    days_ahead = (target_weekday - base.weekday() + 7) % 7
    send_date = base + timedelta(days=days_ahead)
    return datetime.combine(send_date.date(), target_time)


def _spread_within_window(per_day: int, start: time, end: time) -> int:
    total_minutes = (datetime.combine(datetime.utcnow().date(), end) - datetime.combine(datetime.utcnow().date(), start)).seconds // 60
    if total_minutes <= 0:
        raise ValueError("window_end must be after window_start")
    interval = max(math.floor(total_minutes / max(per_day, 1)), 1)
    return interval


_state: State | None = None


def get_state() -> State:
    global _state
    if _state is None:
        _state = State()
    return _state
