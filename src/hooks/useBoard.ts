import { useState, useEffect, useCallback } from 'react';
import { TFile } from 'obsidian';
import { AgileBoard } from '../types/Board';
import { useApp, useServices } from '../context/AppContext';

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
		setBoard(readBoard());
		setBoardFile(getBoardFile());
	}, [readBoard, getBoardFile]);

	useEffect(() => {
		refreshBoard();
		const ref = app.vault.on('modify', (file) => {
			if (file instanceof TFile && file.path === boardPath) refreshBoard();
		});
		return () => app.vault.offref(ref);
	}, [app, boardPath, refreshBoard]);

	const updateBoard = useCallback(async (updates: Partial<AgileBoard>) => {
		const file = getBoardFile();
		if (!file) return;
		await boardService.updateBoard(file, updates);
		refreshBoard();
	}, [getBoardFile, boardService, refreshBoard]);

	return { board, boardFile, updateBoard, refreshBoard };
}
