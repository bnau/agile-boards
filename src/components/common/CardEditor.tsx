import { useState, useEffect } from 'react';
import { AgileCard, CardType, Priority, StoryStatus } from '../../types/Card';
import { CARD_LABELS } from '../../constants';

interface CardEditorProps {
	cardType: CardType;
	initialTitle?: string;
	initialFields?: Partial<AgileCard>;
	onSave: (title: string, fields: Record<string, unknown>) => void;
	onCancel: () => void;
}

export const CardEditor = ({ cardType, initialTitle = '', initialFields = {}, onSave, onCancel }: CardEditorProps) => {
	const [title, setTitle] = useState(initialTitle);
	const label = CARD_LABELS[cardType] ?? cardType;

	useEffect(() => {
		const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
		document.addEventListener('keydown', handler);
		return () => document.removeEventListener('keydown', handler);
	}, [onCancel]);

	const handleSubmit = (fields: Record<string, unknown>) => {
		if (!title.trim()) return;
		onSave(title.trim(), fields);
	};

	return (
		<div className="agile-card-editor">
			<div className="agile-card-editor__header">
				<h3>New {label}</h3>
				<button className="agile-btn agile-btn--icon" onClick={onCancel}>✕</button>
			</div>
			<div className="agile-card-editor__body">
				<label className="agile-field">
					<span className="agile-field__label">Title</span>
					<input
						className="agile-field__input"
						type="text"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						placeholder={`${label} title`}
						autoFocus
					/>
				</label>
				<TypeFields cardType={cardType} initialFields={initialFields} onSubmit={handleSubmit} title={title} onCancel={onCancel} />
			</div>
		</div>
	);
};

interface TypeFieldsProps {
	cardType: CardType;
	initialFields: Partial<AgileCard>;
	title: string;
	onSubmit: (fields: Record<string, unknown>) => void;
	onCancel: () => void;
}

const TypeFields = ({ cardType, initialFields, title, onSubmit, onCancel }: TypeFieldsProps) => {
	switch (cardType) {
		case 'customer':
			return <CustomerFields initialFields={initialFields} title={title} onSubmit={onSubmit} onCancel={onCancel} />;
		case 'value':
			return <ValueFields initialFields={initialFields} title={title} onSubmit={onSubmit} onCancel={onCancel} />;
		case 'problem':
			return <ProblemFields initialFields={initialFields} title={title} onSubmit={onSubmit} onCancel={onCancel} />;
		case 'user-story':
			return <UserStoryFields initialFields={initialFields} title={title} onSubmit={onSubmit} onCancel={onCancel} />;
		default:
			return <DefaultFields title={title} onSubmit={onSubmit} onCancel={onCancel} />;
	}
};

const CustomerFields = ({ initialFields, title, onSubmit, onCancel }: Omit<TypeFieldsProps, 'cardType'>) => {
	const init = initialFields as Partial<{ jobs: string[]; pains: string[]; gains: string[] }>;
	const [jobs, setJobs] = useState((init.jobs ?? []).join('\n'));
	const [pains, setPains] = useState((init.pains ?? []).join('\n'));
	const [gains, setGains] = useState((init.gains ?? []).join('\n'));

	return (
		<>
			<TextareaField label="Jobs (one per line)" value={jobs} onChange={setJobs} />
			<TextareaField label="Pains (one per line)" value={pains} onChange={setPains} />
			<TextareaField label="Gains (one per line)" value={gains} onChange={setGains} />
			<FormActions title={title} onSave={() => onSubmit({ 'segment-name': title, jobs: parseLines(jobs), pains: parseLines(pains), gains: parseLines(gains) })} onCancel={onCancel} />
		</>
	);
};

const ValueFields = ({ initialFields, title, onSubmit, onCancel }: Omit<TypeFieldsProps, 'cardType'>) => {
	const init = initialFields as Partial<{ productsServices: string[]; painRelievers: string[]; gainCreators: string[] }>;
	const [products, setProducts] = useState((init.productsServices ?? []).join('\n'));
	const [relievers, setRelievers] = useState((init.painRelievers ?? []).join('\n'));
	const [creators, setCreators] = useState((init.gainCreators ?? []).join('\n'));

	return (
		<>
			<TextareaField label="Products & Services (one per line)" value={products} onChange={setProducts} />
			<TextareaField label="Pain Relievers (one per line)" value={relievers} onChange={setRelievers} />
			<TextareaField label="Gain Creators (one per line)" value={creators} onChange={setCreators} />
			<FormActions title={title} onSave={() => onSubmit({ 'products-services': parseLines(products), 'pain-relievers': parseLines(relievers), 'gain-creators': parseLines(creators) })} onCancel={onCancel} />
		</>
	);
};

const ProblemFields = ({ title, onSubmit, onCancel }: Omit<TypeFieldsProps, 'cardType'>) => {
	const priorities: Priority[] = ['low', 'medium', 'high', 'critical'];
	const [severity, setSeverity] = useState<Priority>('medium');
	const [alternatives, setAlternatives] = useState('');

	return (
		<>
			<label className="agile-field">
				<span className="agile-field__label">Severity</span>
				<select className="agile-field__select" value={severity} onChange={(e) => setSeverity(e.target.value as Priority)}>
					{priorities.map((p) => <option key={p} value={p}>{p}</option>)}
				</select>
			</label>
			<TextareaField label="Existing Alternatives (one per line)" value={alternatives} onChange={setAlternatives} />
			<FormActions title={title} onSave={() => onSubmit({ severity, 'existing-alternatives': parseLines(alternatives) })} onCancel={onCancel} />
		</>
	);
};

const UserStoryFields = ({ title, onSubmit, onCancel }: Omit<TypeFieldsProps, 'cardType'>) => {
	const statuses: StoryStatus[] = ['backlog', 'ready', 'in-progress', 'done'];
	const [status, setStatus] = useState<StoryStatus>('backlog');
	const [points, setPoints] = useState('');
	const [criteria, setCriteria] = useState('');

	return (
		<>
			<label className="agile-field">
				<span className="agile-field__label">Status</span>
				<select className="agile-field__select" value={status} onChange={(e) => setStatus(e.target.value as StoryStatus)}>
					{statuses.map((s) => <option key={s} value={s}>{s}</option>)}
				</select>
			</label>
			<label className="agile-field">
				<span className="agile-field__label">Story Points</span>
				<input className="agile-field__input" type="number" min="0" value={points} onChange={(e) => setPoints(e.target.value)} placeholder="Optional" />
			</label>
			<TextareaField label="Acceptance Criteria (one per line)" value={criteria} onChange={setCriteria} />
			<FormActions title={title} onSave={() => onSubmit({ status, 'story-points': points ? parseInt(points) : undefined, 'acceptance-criteria': parseLines(criteria) })} onCancel={onCancel} />
		</>
	);
};

const DefaultFields = ({ title, onSubmit, onCancel }: { title: string; onSubmit: (f: Record<string, unknown>) => void; onCancel: () => void }) => (
	<FormActions title={title} onSave={() => onSubmit({})} onCancel={onCancel} />
);

const TextareaField = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
	<label className="agile-field">
		<span className="agile-field__label">{label}</span>
		<textarea className="agile-field__textarea" value={value} onChange={(e) => onChange(e.target.value)} rows={3} />
	</label>
);

const FormActions = ({ title, onSave, onCancel }: { title: string; onSave: () => void; onCancel: () => void }) => (
	<div className="agile-card-editor__actions">
		<button className="agile-btn agile-btn--primary" disabled={!title.trim()} onClick={onSave}>Create</button>
		<button className="agile-btn" onClick={onCancel}>Cancel</button>
	</div>
);

function parseLines(text: string): string[] {
	return text.split('\n').map((l) => l.trim()).filter(Boolean);
}
