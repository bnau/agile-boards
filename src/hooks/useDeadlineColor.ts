import { useCallback, useEffect, useState } from 'react';
import { Ref, DeadlineColor } from '../types/Board';
import { useApp, useServices } from '../context/AppContext';
import { deadlineColor } from '../utils/deadline';

/**
 * Deadline color for a card, recomputed when the source Roadmaps, the story note,
 * or the column's terminal flag changes. The date comes from the earliest release
 * across all linked roadmaps that contain the story. Independent cards pass
 * `roadmapRefs: []` and always receive blue.
 */
export function useDeadlineColor(args: {
	storyRef: Ref;
	roadmapRefs: Ref[];
	sourcePath: string; // kanban board path
	terminal: boolean;
}): DeadlineColor {
	const { storyRef, roadmapRefs, sourcePath, terminal } = args;
	const app = useApp();
	const { releaseDateService } = useServices();

	const compute = useCallback(
		(): DeadlineColor =>
			deadlineColor(releaseDateService.earliestReleaseDateFor(storyRef, roadmapRefs, sourcePath), { terminal }),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[releaseDateService, storyRef, sourcePath, terminal, ...roadmapRefs],
	);

	const [color, setColor] = useState<DeadlineColor>(compute);

	useEffect(() => {
		setColor(compute());
		const recompute = () => setColor(compute());
		// Re-read when the Roadmap board's frontmatter (release dates) or any note resolves/changes.
		const changedRef = app.metadataCache.on('changed', recompute);
		const resolvedRef = app.metadataCache.on('resolved', recompute);
		return () => {
			app.metadataCache.offref(changedRef);
			app.metadataCache.offref(resolvedRef);
		};
	}, [app, compute]);

	return color;
}
