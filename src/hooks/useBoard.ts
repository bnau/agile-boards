import { useState, useEffect, useCallback } from 'react';
import { TFile } from 'obsidian';
import { AgileBoard } from '../types/Board';
import { useApp, useServices } from '../context/AppContext';

/**
 * Load a board's layout from its note and expose typed mutations. Re-reads when
 * the board note changes (vault modify or metadata cache update) so hand-edits
 * to the frontmatter are reflected.
 */
export function useBoard(boardPath: string): {
	board: AgileBoard | null;
	boardFile: TFile | null;
	updateBoard: (updates: Partial<AgileBoard>) => Promise<void>;
	refreshBoard: () => void;
} {
	const app = useApp();
	const { boardService } = useServices();

	const getBoardFile = useCallback((): TFile | null => {
		const f = app.vault.getAbstractFileByPath(boardPath);
		return f instanceof TFile ? f : null;
	}, [app, boardPath]);

	const readBoard = useCallback((): AgileBoard | null => {
		const file = getBoardFile();
		return file ? boardService.parseBoard(file) : null;
	}, [getBoardFile, boardService]);

	const [board, setBoard] = useState<AgileBoard | null>(readBoard);
	const [boardFile, setBoardFile] = useState<TFile | null>(getBoardFile);

	const refreshBoard = useCallback(() => {
		const b = readBoard();
		if (b !== null) {
			setBoard(b);
			setBoardFile(getBoardFile());
		} else {
			// MetadataCache misses non-.md files (e.g. .board); read raw content.
			const file = getBoardFile();
			if (file) boardService.parseBoardAsync(file).then((parsed) => {
				setBoard(parsed);
				setBoardFile(getBoardFile());
			});
		}
	}, [readBoard, getBoardFile, boardService]);

	useEffect(() => {
		refreshBoard();
		const modifyRef = app.vault.on('modify', (file) => {
			if (file instanceof TFile && file.path === boardPath) refreshBoard();
		});
		const metaRef = app.metadataCache.on('changed', (file) => {
			if (file.path === boardPath) refreshBoard();
		});
		return () => {
			app.vault.offref(modifyRef);
			app.metadataCache.offref(metaRef);
		};
	}, [app, boardPath, refreshBoard]);

	const updateBoard = useCallback(async (updates: Partial<AgileBoard>) => {
		const file = getBoardFile();
		if (!file) return;
		await boardService.updateBoard(file, updates);
		refreshBoard();
	}, [getBoardFile, boardService, refreshBoard]);

	return { board, boardFile, updateBoard, refreshBoard };
}
