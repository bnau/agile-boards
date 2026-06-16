import { useState } from 'react';

interface Card {
	id: string;
	title: string;
}

interface Column {
	id: string;
	title: string;
	cards: Card[];
}

// Placeholder in-memory board. Persistence to vault notes is a future feature
// (see Principle IV — User Vault Data Safety) and intentionally not implemented
// here yet (Principle II — YAGNI).
const INITIAL_COLUMNS: Column[] = [
	{ id: 'todo', title: 'To Do', cards: [{ id: 'c1', title: 'Welcome to Agile Boards' }] },
	{ id: 'doing', title: 'Doing', cards: [] },
	{ id: 'done', title: 'Done', cards: [] },
];

export const Board = () => {
	const [columns] = useState<Column[]>(INITIAL_COLUMNS);

	return (
		<div className="agile-boards-container">
			<h2>Agile board</h2>
			<div className="agile-boards-columns">
				{columns.map((column) => (
					<div key={column.id} className="agile-boards-column">
						<h3>{column.title}</h3>
						{column.cards.map((card) => (
							<div key={card.id} className="agile-boards-card">
								{card.title}
							</div>
						))}
					</div>
				))}
			</div>
		</div>
	);
};
