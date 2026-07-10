import type { ProjectTimeLog, TimesheetStatus } from '../../../models/timesheet';

/** A week's single aggregate status, computed the same way everywhere (the employee's
 * own grid, the manager's Team Approvals table, and the submission history panel) --
 * a mismatch here previously meant a week showing SUBMITTED to the employee (who
 * added one extra draft entry after submitting) could show as DRAFT to their manager,
 * hiding the Approve/Reject actions entirely.
 *
 * Priority: REJECTED needs the employee's attention above all else. SUBMITTED ranks
 * above a lingering DRAFT so a manager always sees (and can act on) anything actually
 * submitted, even if the employee later added an unrelated draft entry to the same
 * week. APPROVED only applies once every entry in the week is approved.
 */
export const computeWeekStatus = (logs: ProjectTimeLog[]): TimesheetStatus => {
	if (logs.length === 0) return 'draft';
	const statuses = logs.map((l) => l.status);
	if (statuses.includes('rejected')) return 'rejected';
	if (statuses.includes('submitted')) return 'submitted';
	if (statuses.includes('approved') && !statuses.includes('draft')) return 'approved';
	return 'draft';
};
