import { useEffect, useRef, useState } from 'react';
import { TFile } from 'obsidian';
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
	/** Board section this post-it belongs to; used as the note's type subfolder on quick-create. */
	cardType?: string;
	/** Card types the relink picker may offer; defaults to [cardType]. */
	linkTypes?: string[];
}

/**
 * Renders one content note as a post-it: title + body preview. The title is the
 * note's file name; clicking the post-it edits it inline (renaming the file),
 * while a hover button opens the underlying note. A missing reference renders a
 * non-destructive indicator with relink / quick-create.
 */
export const PostIt = ({ refStr, sourcePath, onRemove, onReplace, compact, cardType, linkTypes }: PostItProps) => {
	const app = useApp();
	const { noteService, referenceService, boardService, indexService } = useServices();
	const { file, title, preview, missing, loading } = useNotePreview(refStr, sourcePath);

	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState('');
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);

	const open = (newPane: boolean) => {
		app.workspace.openLinkText(referenceService.linkpath(refStr), sourcePath, newPane);
	};

	const startEdit = () => {
		if (!file) return;
		setDraft(file.basename);
		setEditing(true);
	};

	const commit = async () => {
		setEditing(false);
		const next = draft.trim();
		if (!file || !next || next === file.basename) return;

		// Collect refs in other boards BEFORE rename so they still resolve.
		const oldFilePath = file.path;
		type BoardEntry = { boardFile: TFile; oldRefs: string[] };
		const otherBoards: BoardEntry[] = [];
		for (const boardFile of indexService.findBoardsReferencing(oldFilePath)) {
			if (boardFile.path === sourcePath) continue;
			const board = await boardService.parseBoardAsync(boardFile);
			if (!board) continue;
			const matched = boardService.extractRefs(board)
				.filter((r) => referenceService.resolve(r, boardFile.path)?.path === oldFilePath);
			if (matched.length) otherBoards.push({ boardFile, oldRefs: matched });
		}

		await noteService.renameNote(file, next);

		// Update the current board via React state.
		onReplace?.(referenceService.toWikilink(file, sourcePath));

		// Update all other boards that referenced this note.
		const newFilePath = file.path;
		for (const { boardFile, oldRefs } of otherBoards) {
			const newRef = referenceService.toWikilink(file, boardFile.path);
			await boardService.replaceRefsInBoard(boardFile, oldFilePath, newFilePath, oldRefs, newRef);
		}
	};

	const relink = () => {
		const types = linkTypes ?? (cardType ? [cardType] : []);
		openNotePicker(
			app,
			(file) => onReplace?.(referenceService.toWikilink(file, sourcePath)),
			types.length ? { items: noteService.notesOfType(types, sourcePath), cardType } : {},
		);
	};

	const quickCreate = async () => {
		const file = await noteService.createNote(referenceService.label(refStr), { boardPath: sourcePath, cardType });
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
			onClick={() => { if (!editing) startEdit(); }}
			role="button"
			tabIndex={0}
			onKeyDown={(e) => { if (!editing && e.key === 'Enter') startEdit(); }}
			title="Click to rename"
		>
			<div className="agile-postit__header">
				{editing ? (
					<input
						ref={inputRef}
						className="agile-postit__title-input"
						value={draft}
						onChange={(e) => setDraft(e.target.value)}
						onClick={(e) => e.stopPropagation()}
						onBlur={commit}
						onKeyDown={(e) => {
							e.stopPropagation();
							if (e.key === 'Enter') { e.preventDefault(); commit(); }
							else if (e.key === 'Escape') { e.preventDefault(); setEditing(false); }
						}}
					/>
				) : (
					<span className="agile-postit__title">{loading ? '…' : title}</span>
				)}
				{!editing && (
					<button
						className="agile-btn agile-btn--icon agile-postit__open"
						onClick={(e) => { e.stopPropagation(); open(true); }}
						title="Open note in a new tab"
					>
						↗
					</button>
				)}
				{onRemove && !editing && (
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
