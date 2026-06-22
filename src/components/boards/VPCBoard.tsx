import { useState } from 'react';
import { VPCBoard as VPCBoardType, VPCSegment, emptyVPCSegment } from '../../types/Board';
import { Section } from '../common/Section';
import { PostIt } from '../common/PostIt';
import { AddPostIt } from '../common/AddPostIt';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useServices } from '../../context/AppContext';
import { CARD_TYPE } from '../../constants';

interface VPCBoardProps {
	board: VPCBoardType;
	boardPath: string;
	onBoardUpdate: (updates: Partial<VPCBoardType>) => Promise<void>;
}

export const VPCBoard = ({ board, boardPath, onBoardUpdate }: VPCBoardProps) => {
	const { referenceService } = useServices();
	const [active, setActive] = useState(Math.min(board.activeSegment, Math.max(board.segments.length - 1, 0)));
	const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

	const segment: VPCSegment | undefined = board.segments[active];

	const allRefs: string[] = [];
	for (const seg of board.segments) {
		if (seg.customer) allRefs.push(seg.customer);
		allRefs.push(...seg.jobs, ...seg.pains, ...seg.gains, ...seg.productsServices, ...seg.painRelievers, ...seg.gainCreators);
	}

	const updateSegment = (patch: Partial<VPCSegment>) => {
		const segments = board.segments.map((s, i) => (i === active ? { ...s, ...patch } : s));
		onBoardUpdate({ segments });
	};

	const addSegment = () => {
		const segments = [...board.segments, emptyVPCSegment()];
		onBoardUpdate({ segments, activeSegment: segments.length - 1 });
		setActive(segments.length - 1);
	};

	const deleteSegment = (idx: number) => {
		const segments = board.segments.filter((_, i) => i !== idx);
		const next = Math.max(0, Math.min(active, segments.length - 1));
		onBoardUpdate({ segments, activeSegment: next });
		setActive(next);
		setConfirmDelete(null);
	};

	const tabLabel = (seg: VPCSegment, i: number) =>
		seg.customer ? referenceService.label(seg.customer) : `Segment ${i + 1}`;

	return (
		<div className="agile-vpc-board">
			<div className="agile-vpc-board__tabs" role="tablist">
				{board.segments.map((seg, i) => (
					<div
						key={i}
						className={`agile-vpc-board__tab ${i === active ? 'agile-vpc-board__tab--active' : ''}`}
						onClick={() => setActive(i)}
						role="tab"
						aria-selected={i === active}
						tabIndex={0}
						onKeyDown={(e) => e.key === 'Enter' && setActive(i)}
					>
						{tabLabel(seg, i)}
						<button
							className="agile-btn agile-btn--icon"
							onClick={(e) => { e.stopPropagation(); setConfirmDelete(i); }}
							title="Remove segment"
						>
							✕
						</button>
					</div>
				))}
				<button className="agile-btn agile-btn--add agile-vpc-board__add-tab" onClick={addSegment}>
					+ Segment
				</button>
			</div>

			{!segment ? (
				<div className="agile-vpc-board__empty">
					<p>No customer segments yet.</p>
					<button className="agile-btn agile-btn--primary" onClick={addSegment}>Add first segment</button>
				</div>
			) : (
				<div className="agile-vpc-board__panels">
					<div className="agile-vpc-panel agile-vpc-panel--customer">
						<h3 className="agile-vpc-panel__title">Customer Profile</h3>
						<div className="agile-vpc-panel__anchor">
							<div className="agile-section__title">Customer Segment</div>
							{segment.customer ? (
								<PostIt
									refStr={segment.customer}
									sourcePath={boardPath}
									onRemove={() => updateSegment({ customer: undefined })}
									onReplace={(next) => updateSegment({ customer: next })}
									compact
									cardType={CARD_TYPE.customerSegment}
								/>
							) : (
								<AddPostIt sourcePath={boardPath} onAdd={(ref) => updateSegment({ customer: ref })} label="+ Customer" cardType={CARD_TYPE.customerSegment} excludeRefs={allRefs} />
							)}
						</div>
						<Section title="Jobs" refs={segment.jobs} sourcePath={boardPath} onChange={(jobs) => updateSegment({ jobs })} excludeRefs={allRefs} />
						<Section title="Pains" refs={segment.pains} sourcePath={boardPath} onChange={(pains) => updateSegment({ pains })} excludeRefs={allRefs} />
						<Section title="Gains" refs={segment.gains} sourcePath={boardPath} onChange={(gains) => updateSegment({ gains })} excludeRefs={allRefs} />
					</div>

					<div className="agile-vpc-panel agile-vpc-panel--value">
						<h3 className="agile-vpc-panel__title">Value Map</h3>
						<Section title="Products &amp; Services" refs={segment.productsServices} sourcePath={boardPath} onChange={(productsServices) => updateSegment({ productsServices })} cardType={CARD_TYPE.valueProposition} excludeRefs={allRefs} />
						<Section title="Pain Relievers" refs={segment.painRelievers} sourcePath={boardPath} onChange={(painRelievers) => updateSegment({ painRelievers })} excludeRefs={allRefs} />
						<Section title="Gain Creators" refs={segment.gainCreators} sourcePath={boardPath} onChange={(gainCreators) => updateSegment({ gainCreators })} excludeRefs={allRefs} />
					</div>
				</div>
			)}

			{confirmDelete !== null && (
				<ConfirmDialog
					title="Remove segment?"
					message="This removes the segment from the board layout. The linked notes are not deleted."
					confirmLabel="Remove"
					dangerous
					onConfirm={() => deleteSegment(confirmDelete)}
					onCancel={() => setConfirmDelete(null)}
				/>
			)}
		</div>
	);
};
