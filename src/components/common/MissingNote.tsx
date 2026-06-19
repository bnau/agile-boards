interface MissingNoteProps {
	label: string;
	onRelink: () => void;
	onCreate: () => void;
	onRemove?: () => void;
}

/** Non-destructive indicator for a reference that does not resolve to a note. */
export const MissingNote = ({ label, onRelink, onCreate, onRemove }: MissingNoteProps) => (
	<div className="agile-missing-note" title={`Missing note: ${label}`}>
		<span className="agile-missing-note__icon">⚠</span>
		<span className="agile-missing-note__label">{label}</span>
		<div className="agile-missing-note__actions">
			<button className="agile-btn agile-btn--small" onClick={onCreate} title="Create a note with this name">Create</button>
			<button className="agile-btn agile-btn--small" onClick={onRelink} title="Link an existing note instead">Relink</button>
			{onRemove && (
				<button className="agile-btn agile-btn--icon agile-btn--danger" onClick={onRemove} title="Remove from board">✕</button>
			)}
		</div>
	</div>
);
