import { App, TFile, EventRef } from 'obsidian';
import { BoardType } from '../types/Board';
import { BoardService } from './BoardService';
import { ReferenceService } from './ReferenceService';

type ChangeListener = () => void;

/**
 * Lightweight in-memory index of boards and which notes they reference.
 * Used to answer "which boards display this note?" so open boards can re-render
 * when a referenced note changes. Content notes are untyped, so there is no
 * per-type index — the note picker searches the vault directly.
 */
export class IndexService {
	private boards = new Set<string>();
	private referencedBy = new Map<string, Set<string>>(); // note path -> board paths
	private boardTypeCache = new Map<string, BoardType>();
	private boardTitleCache = new Map<string, string>();
	private listeners = new Set<ChangeListener>();
	private metaRefs: EventRef[] = [];
	private vaultRefs: EventRef[] = [];

	constructor(
		private app: App,
		private boardService: BoardService,
		private referenceService: ReferenceService,
	) {}

	initialize(): void {
		this.rebuild();

		this.metaRefs.push(this.app.metadataCache.on('changed', (file) => this.onChange(file)));
		this.metaRefs.push(this.app.metadataCache.on('resolved', () => this.rebuild()));
		this.vaultRefs.push(this.app.vault.on('delete', (file) => {
			if (file instanceof TFile) this.onDelete(file);
		}));
		this.vaultRefs.push(this.app.vault.on('rename', () => this.rebuild()));
		this.vaultRefs.push(this.app.vault.on('create', (file) => {
			if (file instanceof TFile && file.extension === 'board') this.rebuild();
		}));
		this.vaultRefs.push(this.app.vault.on('modify', (file) => {
			if (file instanceof TFile && file.extension === 'board') this.rebuild();
		}));
	}

	destroy(): void {
		this.metaRefs.forEach((ref) => this.app.metadataCache.offref(ref));
		this.vaultRefs.forEach((ref) => this.app.vault.offref(ref));
		this.metaRefs = [];
		this.vaultRefs = [];
		this.listeners.clear();
	}

	getAllBoards(): TFile[] {
		return [...this.boards]
			.map((p) => this.app.vault.getAbstractFileByPath(p))
			.filter((f): f is TFile => f instanceof TFile);
	}

	getBoardsOfType(type: BoardType): TFile[] {
		return [...this.boards]
			.filter((p) => this.boardTypeCache.get(p) === type)
			.map((p) => this.app.vault.getAbstractFileByPath(p))
			.filter((f): f is TFile => f instanceof TFile);
	}

	getBoardTitle(path: string): string | undefined {
		return this.boardTitleCache.get(path);
	}

	/** Board files that reference a given note path. */
	findBoardsReferencing(notePath: string): TFile[] {
		const set = this.referencedBy.get(notePath);
		if (!set) return [];
		return [...set]
			.map((p) => this.app.vault.getAbstractFileByPath(p))
			.filter((f): f is TFile => f instanceof TFile);
	}

	subscribe(listener: ChangeListener): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	private onChange(file: TFile): void {
		const wasBoard = this.boards.has(file.path);
		const isBoard = file.extension === 'board' || this.boardService.parseBoard(file) !== null;
		if (wasBoard || isBoard) {
			this.rebuild();
		}
	}

	private onDelete(file: TFile): void {
		if (this.boards.has(file.path)) this.rebuild();
	}

	private async rebuild(): Promise<void> {
		const localBoards = new Set<string>();
		const localRefBy = new Map<string, Set<string>>();
		const localTypeCache = new Map<string, BoardType>();
		const localTitleCache = new Map<string, string>();

		for (const file of this.boardService.getAllBoards()) {
			localBoards.add(file.path);
			const board = await this.boardService.parseBoardAsync(file);
			if (!board) continue;
			localTypeCache.set(file.path, board.boardType);
			localTitleCache.set(file.path, board.title);
			for (const ref of this.boardService.extractRefs(board)) {
				const dest = this.referenceService.resolve(ref, file.path);
				if (!dest) continue;
				if (!localRefBy.has(dest.path)) localRefBy.set(dest.path, new Set());
				localRefBy.get(dest.path)!.add(file.path);
			}
		}

		this.boards = localBoards;
		this.referencedBy = localRefBy;
		this.boardTypeCache = localTypeCache;
		this.boardTitleCache = localTitleCache;
		this.notify();
	}

	private notify(): void {
		this.listeners.forEach((l) => l());
	}
}
