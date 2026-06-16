interface MissingReferenceProps {
	label: string;
	onRelink?: () => void;
	onCreateNew?: () => void;
}

export const MissingReference = ({ label, onRelink, onCreateNew }: MissingReferenceProps) => {
	return (
		<div className="agile-missing-reference">
			<span className="agile-missing-reference__icon">⚠</span>
			<span className="agile-missing-reference__label">Missing: {label}</span>
			<div className="agile-missing-reference__actions">
				{onRelink && (
					<button
						className="agile-btn agile-btn--small"
						onClick={onRelink}
						title="Re-link to an existing card"
					>
						Re-link
					</button>
				)}
				{onCreateNew && (
					<button
						className="agile-btn agile-btn--small"
						onClick={onCreateNew}
						title="Create a new card"
					>
						Create
					</button>
				)}
			</div>
		</div>
	);
};
