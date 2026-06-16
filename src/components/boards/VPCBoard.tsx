import { useState } from 'react';
import { VPCBoard as VPCBoardType, VPCSegment } from '../../types/Board';
import { CustomerCard, ValueCard, AgileCard } from '../../types/Card';
import { Card } from '../common/Card';
import { CardEditor } from '../common/CardEditor';
import { ReferenceSelector } from '../common/ReferenceSelector';
import { MissingReference } from '../common/MissingReference';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useCards } from '../../hooks/useCards';
import { useServices, useApp } from '../../context/AppContext';

interface VPCBoardProps {
	board: VPCBoardType;
	boardPath: string;
	onBoardUpdate: (updates: Partial<VPCBoardType>) => Promise<void>;
}

export const VPCBoard = ({ board, boardPath, onBoardUpdate }: VPCBoardProps) => {
	const [activeSegment, setActiveSegment] = useState(board.activeSegment);
	const [addingSegment, setAddingSegment] = useState(false);
	const [creatingCard, setCreatingCard] = useState<'customer' | 'value' | null>(null);
	const [confirmDeleteSegment, setConfirmDeleteSegment] = useState<number | null>(null);

	const allCustomers = useCards('customer') as CustomerCard[];
	const allValues = useCards('value') as ValueCard[];
	const { cardService } = useServices();
	const app = useApp();

	const segment: VPCSegment | undefined = board.segments[activeSegment];

	const customerCard = segment
		? allCustomers.find((c) => c.path === segment.customer || c.title === segment.customer)
		: undefined;
	const valueCard = segment
		? allValues.find((v) => v.path === segment.value || v.title === segment.value)
		: undefined;

	const handleAddSegment = async () => {
		setAddingSegment(false);
		setCreatingCard('customer');
	};

	const handleCreateCustomer = async (title: string, fields: Record<string, unknown>) => {
		const file = await cardService.createCard('customer', title, fields);
		const newSegment: VPCSegment = { customer: file.path, value: '' };
		const segments = [...board.segments, newSegment];
		await onBoardUpdate({ segments, activeSegment: segments.length - 1 });
		setActiveSegment(segments.length - 1);
		setCreatingCard(null);
	};

	const handleCreateValue = async (title: string, fields: Record<string, unknown>) => {
		if (!segment) return;
		const customerRef = customerCard ? `[[${customerCard.title}]]` : '';
		const file = await cardService.createCard('value', title, { ...fields, customer: customerRef });
		const segments = board.segments.map((s, i) =>
			i === activeSegment ? { ...s, value: file.path } : s
		);
		await onBoardUpdate({ segments });
		setCreatingCard(null);
	};

	const handleLinkCustomer = async (card: AgileCard) => {
		const segments = [...board.segments];
		if (segments[activeSegment]) {
			segments[activeSegment] = { ...segments[activeSegment], customer: card.path };
			await onBoardUpdate({ segments });
		}
	};

	const handleLinkValue = async (card: AgileCard) => {
		const segments = [...board.segments];
		if (segments[activeSegment]) {
			segments[activeSegment] = { ...segments[activeSegment], value: card.path };
			await onBoardUpdate({ segments });
		}
	};

	const handleOpenCard = (card: AgileCard) => {
		app.workspace.openLinkText(card.title, boardPath, false);
	};

	const handleDeleteSegment = async (idx: number) => {
		const segments = board.segments.filter((_, i) => i !== idx);
		const next = Math.min(activeSegment, segments.length - 1);
		await onBoardUpdate({ segments, activeSegment: next < 0 ? 0 : next });
		setActiveSegment(next < 0 ? 0 : next);
		setConfirmDeleteSegment(null);
	};

	return (
		<div className="agile-vpc-board">
			<div className="agile-vpc-board__tabs">
				{board.segments.map((seg, i) => {
					const cust = allCustomers.find((c) => c.path === seg.customer);
					return (
						<div
							key={i}
							className={`agile-vpc-board__tab ${i === activeSegment ? 'agile-vpc-board__tab--active' : ''}`}
							onClick={() => setActiveSegment(i)}
							role="tab"
							aria-selected={i === activeSegment}
							tabIndex={0}
							onKeyDown={(e) => e.key === 'Enter' && setActiveSegment(i)}
						>
							{cust ? cust.title : `Segment ${i + 1}`}
							<button
								className="agile-btn agile-btn--icon"
								onClick={(e) => { e.stopPropagation(); setConfirmDeleteSegment(i); }}
								title="Remove segment"
							>
								✕
							</button>
						</div>
					);
				})}
				<button
					className="agile-btn agile-btn--add agile-vpc-board__add-tab"
					onClick={() => setAddingSegment(true)}
				>
					+ Segment
				</button>
			</div>

			{board.segments.length === 0 ? (
				<div className="agile-vpc-board__empty">
					<p>No customer segments yet.</p>
					<button className="agile-btn agile-btn--primary" onClick={handleAddSegment}>
						Add first segment
					</button>
				</div>
			) : (
				<div className="agile-vpc-board__panels">
					{/* Customer Profile Panel */}
					<div className="agile-vpc-panel agile-vpc-panel--customer">
						<h3 className="agile-vpc-panel__title">Customer Profile</h3>
						{customerCard ? (
							<>
								<Card card={customerCard} onOpen={handleOpenCard} />
								<CustomerDetail card={customerCard} />
							</>
						) : segment?.customer ? (
							<MissingReference
								label={segment.customer}
								onRelink={() => { /* open reference selector */ }}
								onCreateNew={() => setCreatingCard('customer')}
							/>
						) : (
							<div className="agile-vpc-panel__placeholder">
								<ReferenceSelector
									cardType="customer"
									availableCards={allCustomers}
									selectedPaths={[]}
									onSelect={handleLinkCustomer}
									onDeselect={() => {}}
									onCreateNew={() => setCreatingCard('customer')}
								/>
							</div>
						)}
					</div>

					{/* Value Map Panel */}
					<div className="agile-vpc-panel agile-vpc-panel--value">
						<h3 className="agile-vpc-panel__title">Value Map</h3>
						{valueCard ? (
							<>
								<Card card={valueCard} onOpen={handleOpenCard} />
								<ValueDetail card={valueCard} />
							</>
						) : segment?.value ? (
							<MissingReference
								label={segment.value}
								onRelink={() => { /* open reference selector */ }}
								onCreateNew={() => setCreatingCard('value')}
							/>
						) : (
							<div className="agile-vpc-panel__placeholder">
								<ReferenceSelector
									cardType="value"
									availableCards={allValues}
									selectedPaths={[]}
									onSelect={handleLinkValue}
									onDeselect={() => {}}
									onCreateNew={() => setCreatingCard('value')}
								/>
							</div>
						)}
					</div>
				</div>
			)}

			{confirmDeleteSegment !== null && (
				<ConfirmDialog
					title="Remove segment?"
					message={`This will remove the segment from the board. The linked customer and value cards will not be deleted.`}
					confirmLabel="Remove"
					dangerous
					onConfirm={() => handleDeleteSegment(confirmDeleteSegment)}
					onCancel={() => setConfirmDeleteSegment(null)}
				/>
			)}

			{creatingCard === 'customer' && (
				<div className="agile-overlay">
					<div className="agile-overlay__content">
						<CardEditor
							cardType="customer"
							onSave={handleCreateCustomer}
							onCancel={() => setCreatingCard(null)}
						/>
					</div>
				</div>
			)}

			{creatingCard === 'value' && (
				<div className="agile-overlay">
					<div className="agile-overlay__content">
						<CardEditor
							cardType="value"
							onSave={handleCreateValue}
							onCancel={() => setCreatingCard(null)}
						/>
					</div>
				</div>
			)}
		</div>
	);
};

const CustomerDetail = ({ card }: { card: CustomerCard }) => (
	<div className="agile-vpc-detail">
		<Section title="Jobs to be Done" items={card.jobs} />
		<Section title="Pains" items={card.pains} />
		<Section title="Gains" items={card.gains} />
	</div>
);

const ValueDetail = ({ card }: { card: ValueCard }) => (
	<div className="agile-vpc-detail">
		<Section title="Products & Services" items={card.productsServices} />
		<Section title="Pain Relievers" items={card.painRelievers} />
		<Section title="Gain Creators" items={card.gainCreators} />
	</div>
);

const Section = ({ title, items }: { title: string; items: string[] }) => (
	<div className="agile-vpc-section">
		<h4 className="agile-vpc-section__title">{title}</h4>
		{items.length > 0 ? (
			<ul className="agile-vpc-section__list">
				{items.map((item, i) => <li key={i}>{item}</li>)}
			</ul>
		) : (
			<p className="agile-vpc-section__empty">None added yet.</p>
		)}
	</div>
);
