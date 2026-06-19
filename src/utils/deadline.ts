import { DeadlineColor } from '../types/Board';
import { DEADLINE_THRESHOLDS } from '../constants';

/**
 * Map a release target date to a deadline color by days remaining.
 *   terminal column         -> 'none' (no color shown)
 *   no / invalid date       -> 'blue'
 *   days > 30               -> 'green'
 *   14 < days <= 30         -> 'yellow'
 *    7 < days <= 14         -> 'orange'
 *        days <= 7          -> 'red'  (includes 0 and overdue)
 * Days are computed on date-only boundaries.
 */
export function deadlineColor(
	targetDate: string | null,
	opts: { terminal: boolean; today?: Date },
): DeadlineColor {
	if (opts.terminal) return 'none';
	if (!targetDate) return 'blue';

	const target = new Date(targetDate);
	if (isNaN(target.getTime())) return 'blue';

	const now = opts.today ?? new Date();
	const t0 = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
	const t1 = Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate());
	const days = Math.round((t1 - t0) / 86_400_000);

	if (days > DEADLINE_THRESHOLDS.green) return 'green';
	if (days > DEADLINE_THRESHOLDS.yellow) return 'yellow';
	if (days > DEADLINE_THRESHOLDS.orange) return 'orange';
	return 'red';
}
