import { App, TFile, EventRef } from 'obsidian';
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
		const isBoard = this.boardService.parseBoard(file) !== null;
		if (wasBoard || isBoard) {
			this.rebuild();
		}
	}

	private onDelete(file: TFile): void {
		if (this.boards.has(file.path)) this.rebuild();
	}

	private rebuild(): void {
		this.boards.clear();
		this.referencedBy.clear();

		for (const file of this.boardService.getAllBoards()) {
			this.boards.add(file.path);
			const board = this.boardService.parseBoard(file);
			if (!board) continue;
			for (const ref of this.boardService.extractRefs(board)) {
				const dest = this.referenceService.resolve(ref, file.path);
				if (!dest) continue;
				if (!this.referencedBy.has(dest.path)) this.referencedBy.set(dest.path, new Set());
				this.referencedBy.get(dest.path)!.add(file.path);
			}
		}
		this.notify();
	}

	private notify(): void {
		this.listeners.forEach((l) => l());
	}
}
