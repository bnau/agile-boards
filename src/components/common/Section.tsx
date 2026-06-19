import { useState } from 'react';
import { PostIt } from './PostIt';
import { AddPostIt } from './AddPostIt';

interface SectionProps {
	title?: string;
	/** Ordered wikilink references shown in this section. */
	refs: string[];
	sourcePath: string;
	/** Persist a new ordered list of references for this section. */
	onChange: (refs: string[]) => void;
	addLabel?: string;
	compact?: boolean;
	className?: string;
}

/**
 * An ordered, drag-reorderable list of post-its for one board slot. All edits
 * (add / remove / reorder / replace) mutate only the reference list — never the
 * underlying notes.
 */
export const Section = ({ title, refs, sourcePath, onChange, addLabel, compact, className }: SectionProps) => {
	const [dragIndex, setDragIndex] = useState<number | null>(null);

	const removeAt = (i: number) => onChange(refs.filter((_, idx) => idx !== i));
	const replaceAt = (i: number, next: string) => onChange(refs.map((r, idx) => (idx === i ? next : r)));
	const add = (ref: string) => onChange([...refs, ref]);

	const move = (from: number, to: number) => {
		if (from === to) return;
		const next = [...refs];
		const [item] = next.splice(from, 1);
		next.splice(to, 0, item);
		onChange(next);
	};

	return (
		<div className={`agile-section ${className ?? ''}`}>
			{title && <div className="agile-section__title">{title}</div>}
			<div className="agile-section__items">
				{refs.map((ref, i) => (
					<div
						key={`${ref}-${i}`}
						className={`agile-section__item ${dragIndex === i ? 'agile-section__item--dragging' : ''}`}
						draggable
						onDragStart={() => setDragIndex(i)}
						onDragOver={(e) => e.preventDefault()}
						onDrop={() => { if (dragIndex !== null) move(dragIndex, i); setDragIndex(null); }}
						onDragEnd={() => setDragIndex(null)}
					>
						<PostIt
							refStr={ref}
							sourcePath={sourcePath}
							onRemove={() => removeAt(i)}
							onReplace={(next) => replaceAt(i, next)}
							compact={compact}
						/>
					</div>
				))}
			</div>
			<AddPostIt sourcePath={sourcePath} onAdd={add} label={addLabel} />
		</div>
	);
};
