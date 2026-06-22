import { App } from 'obsidian';
import { BoardService } from './BoardService';
import { ReferenceService } from './ReferenceService';
import { Ref, RoadmapBoard } from '../types/Board';

/**
 * Resolves a story's deadline from a source Roadmap board: the earliest target
 * date among releases whose items contain the story. Read-only — it never
 * writes to the Roadmap or the story.
 */
export class ReleaseDateService {
	constructor(
		private app: App,
		private boardService: BoardService,
		private referenceService: ReferenceService,
	) {}

	/**
	 * Earliest `targetDate` across all roadmaps in `roadmapRefs` that contain
	 * the story. Loops over refs, delegates to `releaseDateFor`, returns the
	 * lexicographically smallest non-null ISO date, or null when no date found.
	 */
	earliestReleaseDateFor(storyRef: Ref, roadmapRefs: Ref[], sourcePath: string): string | null {
		let earliest: string | null = null;
		for (const ref of roadmapRefs) {
			const date = this.releaseDateFor(storyRef, ref, sourcePath);
			if (date && (earliest === null || date < earliest)) earliest = date;
		}
		return earliest;
	}

	/**
	 * Earliest `targetDate` (ISO `YYYY-MM-DD`) of a release in `roadmapRef` whose
	 * items contain the story, or null when there is no Roadmap, it is unresolved
	 * or not a roadmap, no release contains the story, or matching releases have
	 * no target date. `sourcePath` is the Kanban board path (for link resolution).
	 */
	releaseDateFor(storyRef: Ref, roadmapRef: Ref | undefined, sourcePath: string): string | null {
		if (!roadmapRef) return null;
		const roadmapFile = this.referenceService.resolve(roadmapRef, sourcePath);
		if (!roadmapFile) return null;
		const board = this.boardService.parseBoard(roadmapFile);
		if (!board || board.boardType !== 'roadmap') return null;
		const story = this.referenceService.resolve(storyRef, sourcePath);
		if (!story) return null;

		let earliest: string | null = null;
		for (const release of (board as RoadmapBoard).releases) {
			if (!release.targetDate) continue;
			const contains = release.items.some(
				(item) => this.referenceService.resolve(item, roadmapFile.path)?.path === story.path,
			);
			if (!contains) continue;
			if (earliest === null || release.targetDate < earliest) earliest = release.targetDate;
		}
		return earliest;
	}
}
