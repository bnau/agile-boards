import { useState } from 'react';
import { useApp, useServices } from '../../context/AppContext';
import { openNotePicker } from './NotePicker';

interface AddPostItProps {
	/** Path of the board note (for building wikilinks). */
	sourcePath: string;
	/** Called with the new wikilink reference to add to the layout. */
	onAdd: (ref: string) => void;
	label?: string;
	/** Board section this post-it belongs to; used as the note's type subfolder. */
	cardType?: string;
	/** Card types the link picker may offer; defaults to [cardType]. Lets a slot
	 * reuse notes of several compatible types (e.g. a Roadmap item links stories
	 * and features). */
	linkTypes?: string[];
}

/**
 * "+" affordance to add a post-it to a section, either by creating a new note
 * or by linking an existing one. Both paths return a wikilink to add to the
 * board layout; neither edits any note content beyond creating an empty note.
 */
export const AddPostIt = ({ sourcePath, onAdd, label = '+ Add', cardType, linkTypes }: AddPostItProps) => {
	const app = useApp();
	const { noteService, referenceService } = useServices();
	const [creating, setCreating] = useState(false);
	const [title, setTitle] = useState('');

	const createNew = async () => {
		const name = title.trim();
		if (!name) { setCreating(false); return; }
		const file = await noteService.createNote(name, { boardPath: sourcePath, cardType });
		onAdd(referenceService.toWikilink(file, sourcePath));
		setTitle('');
		setCreating(false);
	};

	const linkExisting = () => {
		const types = linkTypes ?? (cardType ? [cardType] : []);
		openNotePicker(
			app,
			(file) => onAdd(referenceService.toWikilink(file, sourcePath)),
			types.length ? { items: noteService.notesOfType(types, sourcePath), cardType } : {},
		);
	};

	if (creating) {
		return (
			<div className="agile-add-postit agile-add-postit--editing">
				<input
					className="agile-field__input"
					autoFocus
					value={title}
					placeholder="Note title…"
					onChange={(e) => setTitle(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === 'Enter') createNew();
						if (e.key === 'Escape') { setTitle(''); setCreating(false); }
					}}
				/>
				<div className="agile-add-postit__actions">
					<button className="agile-btn agile-btn--primary agile-btn--small" onClick={createNew}>Create</button>
					<button className="agile-btn agile-btn--small" onClick={() => { setTitle(''); setCreating(false); }}>Cancel</button>
				</div>
			</div>
		);
	}

	return (
		<div className="agile-add-postit">
			<button className="agile-btn agile-btn--add agile-btn--small" onClick={() => setCreating(true)} title="Create a new note">
				{label}
			</button>
			<button className="agile-btn agile-btn--add agile-btn--small" onClick={linkExisting} title="Link an existing note">
				Link…
			</button>
		</div>
	);
};
