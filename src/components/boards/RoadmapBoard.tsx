import { useState } from 'react';
import { RoadmapBoard as RoadmapBoardType } from '../../types/Board';
import { AgileCard, ReleaseCard, MmfCard, UserStoryCard } from '../../types/Card';
import { CardEditor } from '../common/CardEditor';
import { ReferenceSelector } from '../common/ReferenceSelector';
import { useCards } from '../../hooks/useCards';
import { useServices } from '../../context/AppContext';
import { useApp } from '../../context/AppContext';

interface RoadmapBoardProps {
	board: RoadmapBoardType;
	boardPath: string;
	onBoardUpdate: (updates: Partial<RoadmapBoardType>) => Promise<void>;
}

export const RoadmapBoard = ({ board, boardPath, onBoardUpdate }: RoadmapBoardProps) => {
	const [creatingRelease, setCreatingRelease] = useState(false);
	const [editingDate, setEditingDate] = useState<string | null>(null);

	const releases = useCards('release') as ReleaseCard[];
	const mmfs = useCards('mmf') as MmfCard[];
	const stories = useCards('user-story') as UserStoryCard[];
	const { cardService, indexService } = useServices();
	const app = useApp();

	const boardReleases = board.releases
		.map((ref) => {
			const card = indexService.getCardByPath(ref);
			return card as ReleaseCard | undefined;
		})
		.filter((r): r is ReleaseCard => r !== undefined)
		.sort((a, b) => {
			if (!a.targetDate && !b.targetDate) return 0;
			if (!a.targetDate) return 1;
			if (!b.targetDate) return -1;
			return a.targetDate.localeCompare(b.targetDate);
		});

	const unlinkedReleases = releases.filter((r) => !board.releases.includes(r.path));

	const handleCreateRelease = async (title: string, fields: Record<string, unknown>) => {
		const file = await cardService.createCard('release', title, fields);
		const updatedReleases = [...board.releases, file.path];
		await onBoardUpdate({ releases: updatedReleases });
		setCreatingRelease(false);
	};

	const handleLinkRelease = async (card: AgileCard) => {
		const updatedReleases = [...board.releases, card.path];
		await onBoardUpdate({ releases: updatedReleases });
	};

	const handleUnlinkRelease = async (path: string) => {
		const updatedReleases = board.releases.filter((p) => p !== path);
		await onBoardUpdate({ releases: updatedReleases });
	};

	const handleSetDate = async (releasePath: string, date: string) => {
		const f = app.vault.getFiles().find((f) => f.path === releasePath);
		if (f) await cardService.updateCard(f, { 'target-date': date });
		setEditingDate(null);
	};

	const handleOpenCard = (card: AgileCard) => {
		app.workspace.openLinkText(card.title, boardPath, false);
	};

	const getReleaseMmfs = (release: ReleaseCard): MmfCard[] =>
		release.mmfs.flatMap((ref) => {
			const card = indexService.getCardByPath(ref);
			return card ? [card as MmfCard] : [];
		});

	const getReleaseStories = (release: ReleaseCard): UserStoryCard[] =>
		release.stories.flatMap((ref) => {
			const card = indexService.getCardByPath(ref);
			return card ? [card as UserStoryCard] : [];
		});

	return (
		<div className="agile-roadmap-board">
			<div className="agile-roadmap-board__header">
				<h3>Roadmap</h3>
				<div className="agile-roadmap-board__controls">
					<label className="agile-field agile-field--inline">
						<span className="agile-field__label">Unit:</span>
						<select
							className="agile-field__select"
							value={board.timelineUnit}
							onChange={(e) => onBoardUpdate({ timelineUnit: e.target.value as 'week' | 'month' | 'quarter' })}
						>
							<option value="week">Week</option>
							<option value="month">Month</option>
							<option value="quarter">Quarter</option>
						</select>
					</label>
				</div>
			</div>

			<div className="agile-roadmap-releases">
				{boardReleases.map((release) => (
					<div key={release.path} className={`agile-roadmap-release agile-roadmap-release--${release.status ?? 'planned'}`}>
						<div className="agile-roadmap-release__header">
							<span
								className="agile-roadmap-release__title"
								onClick={() => handleOpenCard(release)}
								role="button"
								tabIndex={0}
								onKeyDown={(e) => e.key === 'Enter' && handleOpenCard(release)}
							>
								{release.title}
								{release.version && <span className="agile-roadmap-release__version">{release.version}</span>}
							</span>
							<div className="agile-roadmap-release__date">
								{editingDate === release.path ? (
									<input
										type="date"
										defaultValue={release.targetDate ?? ''}
										onBlur={(e) => handleSetDate(release.path, e.target.value)}
										autoFocus
									/>
								) : (
									<span
										className="agile-roadmap-release__date-value"
										onClick={() => setEditingDate(release.path)}
										role="button"
										tabIndex={0}
										onKeyDown={(e) => e.key === 'Enter' && setEditingDate(release.path)}
									>
										{release.targetDate ? `📅 ${release.targetDate}` : 'Set date'}
									</span>
								)}
							</div>
							<span className={`agile-roadmap-release__status agile-roadmap-release__status--${release.status ?? 'planned'}`}>
								{release.status ?? 'planned'}
							</span>
							<button
								className="agile-btn agile-btn--icon"
								onClick={() => handleUnlinkRelease(release.path)}
								title="Remove release from roadmap"
							>
								✕
							</button>
						</div>
						<div className="agile-roadmap-release__items">
							{getReleaseMmfs(release).map((mmf) => (
								<div key={mmf.path} className="agile-roadmap-item agile-roadmap-item--mmf">
									<span className="agile-roadmap-item__badge">MMF</span>
									<span
										className="agile-roadmap-item__title"
										onClick={() => handleOpenCard(mmf)}
										role="button"
										tabIndex={0}
										onKeyDown={(e) => e.key === 'Enter' && handleOpenCard(mmf)}
									>
										{mmf.title}
									</span>
								</div>
							))}
							{getReleaseStories(release).map((story) => (
								<div key={story.path} className="agile-roadmap-item agile-roadmap-item--story">
									<span className="agile-roadmap-item__badge">US</span>
									<span
										className="agile-roadmap-item__title"
										onClick={() => handleOpenCard(story)}
										role="button"
										tabIndex={0}
										onKeyDown={(e) => e.key === 'Enter' && handleOpenCard(story)}
									>
										{story.title}
									</span>
								</div>
							))}
						</div>
					</div>
				))}
			</div>

			<div className="agile-roadmap-board__add-release">
				<ReferenceSelector
					cardType="release"
					availableCards={unlinkedReleases}
					selectedPaths={board.releases}
					onSelect={handleLinkRelease}
					onDeselect={handleUnlinkRelease}
					onCreateNew={() => setCreatingRelease(true)}
					multiSelect
				/>
			</div>

			{creatingRelease && (
				<div className="agile-overlay">
					<div className="agile-overlay__content">
						<CardEditor
							cardType="release"
							onSave={handleCreateRelease}
							onCancel={() => setCreatingRelease(false)}
						/>
					</div>
				</div>
			)}
		</div>
	);
};
