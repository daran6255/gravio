"""One-off cleanup for duplicate ProjectTimeLog rows created before the
duplicate-entry validation was added to create_time_log / update_time_log.

A "duplicate group" is a set of non-deleted logs sharing the same
organization, user, log_date, project_id, task_id, category_id, and
billing_type -- the exact identity now enforced on create/update.

For each duplicate group:
  - If every row shares the same status, they're merged into the oldest row
    (hours summed, distinct notes concatenated) and the rest are soft-deleted.
  - If the group has mixed statuses (e.g. one row already APPROVED alongside
    DRAFT duplicates), it's left untouched and reported for manual review --
    silently folding unreviewed hours into an already-approved entry would
    misrepresent what a manager signed off on.

Usage:
    python -m app.scripts.dedupe_timesheet_logs            # dry run (default, no writes)
    python -m app.scripts.dedupe_timesheet_logs --apply    # actually commit the merge/delete
"""
import argparse
import asyncio
from collections import defaultdict
from datetime import datetime, date
from typing import Optional

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models.timesheet import ProjectTimeLog, TimesheetBillingType

GroupKey = tuple[int, int, date, Optional[int], Optional[int], Optional[int], TimesheetBillingType]


def group_key(log: ProjectTimeLog) -> GroupKey:
    return (
        log.organization_id,
        log.user_id,
        log.log_date,
        log.project_id,
        log.task_id,
        log.category_id,
        log.billing_type,
    )


def describe_key(key: GroupKey) -> str:
    org_id, user_id, log_date, project_id, task_id, category_id, billing_type = key
    return (
        f"org={org_id} user={user_id} date={log_date} "
        f"project={project_id} task={task_id} category={category_id} billing={billing_type.value}"
    )


async def run(apply: bool) -> None:
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(ProjectTimeLog).where(ProjectTimeLog.is_deleted.is_(False)))
        logs = result.scalars().all()

        groups: dict[GroupKey, list[ProjectTimeLog]] = defaultdict(list)
        for log in logs:
            groups[group_key(log)].append(log)

        duplicate_groups = {k: v for k, v in groups.items() if len(v) > 1}

        if not duplicate_groups:
            print("No duplicate time log entries found. Nothing to do.")
            return

        merged_count = 0
        skipped_count = 0

        for key, rows in duplicate_groups.items():
            statuses = {r.status for r in rows}

            if len(statuses) > 1:
                skipped_count += 1
                print(
                    f"[SKIP - mixed status] {describe_key(key)} "
                    f"statuses={[s.value for s in statuses]} "
                    f"log_ids={[r.id for r in rows]} hours={[r.hours for r in rows]} "
                    "-- left untouched, review manually."
                )
                continue

            rows_sorted = sorted(rows, key=lambda r: r.created_at)
            survivor = rows_sorted[0]
            duplicates = rows_sorted[1:]

            total_hours = sum(r.hours for r in rows_sorted)
            notes = [r.notes.strip() for r in rows_sorted if r.notes and r.notes.strip()]
            merged_notes = " | ".join(dict.fromkeys(notes)) if notes else survivor.notes

            print(
                f"[MERGE] {describe_key(key)} status={survivor.status.value} "
                f"log_ids={[r.id for r in rows_sorted]} hours={[r.hours for r in rows_sorted]} "
                f"-> survivor={survivor.id} total_hours={total_hours}"
            )

            if total_hours > 24.0:
                print(f"    NOTE: merged total {total_hours}h exceeds the 24h/day cap -- flagging, not skipping.")

            if apply:
                survivor.hours = total_hours
                survivor.notes = merged_notes
                for dup in duplicates:
                    dup.is_deleted = True
                    dup.deleted_at = datetime.utcnow()

            merged_count += 1

        print(
            f"\n{'Applied' if apply else 'Would apply'}: merged {merged_count} duplicate group(s), "
            f"skipped {skipped_count} mixed-status group(s) for manual review."
        )

        if apply:
            await db.commit()
            print("Changes committed.")
        else:
            print("Dry run only -- no changes were made. Re-run with --apply to commit.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Merge duplicate timesheet log entries.")
    parser.add_argument("--apply", action="store_true", help="Actually commit the merge/delete instead of a dry run.")
    args = parser.parse_args()
    asyncio.run(run(apply=args.apply))
