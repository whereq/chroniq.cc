"""chroniq scheduler process.

Runs periodic jobs (booking reminders) via APScheduler. Deployed as its own
container so the API stays request-only (mirrors the flowdesk collector pattern).

    python -m scheduler.main
"""

import asyncio
import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from api.services.reminders import run_reminder_scan
from chroniq.database import AsyncSessionLocal, init_db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("chroniq.scheduler")

SCAN_INTERVAL_MINUTES = 5


async def _reminder_job() -> None:
    async with AsyncSessionLocal() as db:
        try:
            await run_reminder_scan(db)
        except Exception:  # pragma: no cover - keep the scheduler alive
            logger.exception("Reminder scan failed")


async def main() -> None:
    await init_db()
    logger.info("Scheduler starting (reminder scan every %d min)", SCAN_INTERVAL_MINUTES)

    scheduler = AsyncIOScheduler()
    scheduler.add_job(_reminder_job, "interval", minutes=SCAN_INTERVAL_MINUTES, next_run_time=None)
    scheduler.start()

    # Run one scan immediately on boot, then idle forever.
    await _reminder_job()
    while True:
        await asyncio.sleep(3600)


if __name__ == "__main__":
    asyncio.run(main())
