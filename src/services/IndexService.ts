import { App, TFile } from 'obsidian';
import { AgileCard, CardType } from '../types/Card';
import { CardService } from './CardService';

type ChangeListener = () => void;

export class IndexService {
	private byType: Map<CardType, AgileCard[]> = new Map();
	private byPath: Map<string, AgileCard> = new Map();
	private listeners: Set<ChangeListener> = new Set();

	constructor(private app: App, private cardService: CardService) {}

	initialize(): void {
		this.rebuildIndex();

		this.app.vault.on('create', (file) => {
			if (file instanceof TFile) this.onFileChange(file);
		});
		this.app.vault.on('modify', (file) => {
			if (file instanceof TFile) this.onFileChange(file);
		});
		this.app.vault.on('delete', (file) => {
			if (file instanceof TFile) this.onFileDelete(file);
		});
		this.app.vault.on('rename', (file, oldPath) => {
			if (file instanceof TFile) {
				this.byPath.delete(oldPath);
				this.onFileChange(file);
			}
		});

		// MetadataCache fires after frontmatter is parsed — more reliable for frontmatter edits
		this.app.metadataCache.on('changed', (file) => {
			this.onFileChange(file);
		});
	}

	destroy(): void {
		this.listeners.clear();
	}

	getCardsByType(type: CardType): AgileCard[] {
		return this.byType.get(type) ?? [];
	}

	getCardByPath(path: string): AgileCard | undefined {
		return this.byPath.get(path);
	}

	getAllCards(): AgileCard[] {
		return Array.from(this.byPath.values());
	}

	subscribe(listener: ChangeListener): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	private rebuildIndex(): void {
		this.byType.clear();
		this.byPath.clear();

		for (const file of this.app.vault.getFiles()) {
			this.indexFile(file);
		}
		this.notify();
	}

	private onFileChange(file: TFile): void {
		if (!file.extension.match(/^md$/i)) return;
		this.indexFile(file);
		this.notify();
	}

	private onFileDelete(file: TFile): void {
		const existing = this.byPath.get(file.path);
		if (existing) {
			this.byPath.delete(file.path);
			const typeList = this.byType.get(existing.agileType);
			if (typeList) {
				const idx = typeList.findIndex((c) => c.path === file.path);
				if (idx !== -1) typeList.splice(idx, 1);
			}
			this.notify();
		}
	}

	private indexFile(file: TFile): void {
		const card = this.cardService.parseCard(file);
		if (!card) {
			// Remove from index if previously indexed (may have lost agile-type frontmatter)
			const existing = this.byPath.get(file.path);
			if (existing) {
				this.byPath.delete(file.path);
				const typeList = this.byType.get(existing.agileType);
				if (typeList) {
					const idx = typeList.findIndex((c) => c.path === file.path);
					if (idx !== -1) typeList.splice(idx, 1);
				}
			}
			return;
		}

		// Replace old entry for same path (type may have changed)
		const old = this.byPath.get(file.path);
		if (old && old.agileType !== card.agileType) {
			const oldList = this.byType.get(old.agileType);
			if (oldList) {
				const idx = oldList.findIndex((c) => c.path === file.path);
				if (idx !== -1) oldList.splice(idx, 1);
			}
		}

		this.byPath.set(file.path, card);
		if (!this.byType.has(card.agileType)) {
			this.byType.set(card.agileType, []);
		}
		const typeList = this.byType.get(card.agileType)!;
		const idx = typeList.findIndex((c) => c.path === file.path);
		if (idx !== -1) {
			typeList[idx] = card;
		} else {
			typeList.push(card);
		}
	}

	private notify(): void {
		this.listeners.forEach((l) => l());
	}
}
