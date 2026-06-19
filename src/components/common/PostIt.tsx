import { useApp, useServices } from '../../context/AppContext';
import { useNotePreview } from '../../hooks/useNotePreview';
import { MissingNote } from './MissingNote';
import { openNotePicker } from './NotePicker';

interface PostItProps {
	/** Wikilink reference to the content note this post-it displays. */
	refStr: string;
	/** Path of the board note (for link resolution + open context). */
	sourcePath: string;
	/** Remove this post-it from the board layout (does NOT delete the note). */
	onRemove?: () => void;
	/** Replace this reference with another (used by relink / quick-create). */
	onReplace?: (newRef: string) => void;
	compact?: boolean;
}

/**
 * Renders one content note as a post-it: title + body preview. Clicking opens
 * the underlying note for editing. A missing reference renders a non-destructive
 * indicator with relink / quick-create. The note's content is never edited here.
 */
export const PostIt = ({ refStr, sourcePath, onRemove, onReplace, compact }: PostItProps) => {
	const app = useApp();
	const { noteService, referenceService } = useServices();
	const { title, preview, missing, loading } = useNotePreview(refStr, sourcePath);

	const open = (newPane: boolean) => {
		app.workspace.openLinkText(referenceService.linkpath(refStr), sourcePath, newPane);
	};

	const relink = () => {
		openNotePicker(app, (file) => onReplace?.(referenceService.toWikilink(file, sourcePath)));
	};

	const quickCreate = async () => {
		const file = await noteService.createNote(referenceService.label(refStr));
		onReplace?.(referenceService.toWikilink(file, sourcePath));
	};

	if (missing) {
		return (
			<MissingNote
				label={referenceService.label(refStr)}
				onRelink={relink}
				onCreate={quickCreate}
				onRemove={onRemove}
			/>
		);
	}

	return (
		<div
			className={`agile-postit ${compact ? 'agile-postit--compact' : ''}`}
			onClick={(e) => open(e.ctrlKey || e.metaKey)}
			role="button"
			tabIndex={0}
			onKeyDown={(e) => { if (e.key === 'Enter') open(false); }}
			title="Open note"
		>
			<div className="agile-postit__header">
				<span className="agile-postit__title">{loading ? '…' : title}</span>
				{onRemove && (
					<button
						className="agile-btn agile-btn--icon agile-btn--danger agile-postit__remove"
						onClick={(e) => { e.stopPropagation(); onRemove(); }}
						title="Remove from board (keeps the note)"
					>
						✕
					</button>
				)}
			</div>
			{!compact && preview && <div className="agile-postit__preview">{preview}</div>}
		</div>
	);
};
