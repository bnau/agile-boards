import { App, TFile } from 'obsidian';
import { DEFAULT_CARDS_FOLDER, PREVIEW_LENGTH } from '../constants';

/**
 * Owns content-note I/O. A content note is an ordinary Markdown note used as a
 * post-it. NoteService creates such notes, derives their display title and body
 * preview, and (only on explicit user action) deletes them.
 */
export class NoteService {
	constructor(private app: App, private cardsFolder: string = DEFAULT_CARDS_FOLDER) {}

	setCardsFolder(folder: string): void {
		this.cardsFolder = folder || DEFAULT_CARDS_FOLDER;
	}

	getCardsFolder(): string {
		return this.cardsFolder;
	}

	/** Create a new content note for a post-it and return it. */
	async createNote(title: string): Promise<TFile> {
		await this.ensureFolder(this.cardsFolder);
		const safe = title.trim().replace(/[\\/:*?"<>|#^[\]]/g, '-') || 'Untitled';
		const path = await this.uniquePath(`${this.cardsFolder}/${safe}.md`);
		const content = `# ${title.trim() || safe}\n\n`;
		return this.app.vault.create(path, content);
	}

	/** Display title for a post-it: first level-1 heading if present, else basename. */
	getTitle(file: TFile): string {
		const cache = this.app.metadataCache.getFileCache(file);
		const h1 = cache?.headings?.find((h) => h.level === 1);
		return h1?.heading ?? file.basename;
	}

	/** A short body preview (frontmatter and leading H1 stripped). */
	async getPreview(file: TFile): Promise<string> {
		const raw = await this.app.vault.cachedRead(file);
		const body = stripFrontmatter(raw).replace(/^\s*#\s+.*\n?/, '').trim();
		if (body.length <= PREVIEW_LENGTH) return body;
		return body.slice(0, PREVIEW_LENGTH).trimEnd() + '…';
	}

	/** Explicit, user-initiated delete. The only destructive op on a content note. */
	async deleteNote(file: TFile): Promise<void> {
		await this.app.fileManager.trashFile(file);
	}

	private async uniquePath(path: string): Promise<string> {
		if (!this.app.vault.getAbstractFileByPath(path)) return path;
		const base = path.replace(/\.md$/, '');
		for (let i = 2; i < 1000; i++) {
			const candidate = `${base} ${i}.md`;
			if (!this.app.vault.getAbstractFileByPath(candidate)) return candidate;
		}
		return `${base} ${Date.now()}.md`;
	}

	private async ensureFolder(path: string): Promise<void> {
		const parts = path.split('/');
		let current = '';
		for (const part of parts) {
			current = current ? `${current}/${part}` : part;
			if (!this.app.vault.getAbstractFileByPath(current)) {
				await this.app.vault.createFolder(current);
			}
		}
	}
}

function stripFrontmatter(content: string): string {
	if (!content.startsWith('---\n')) return content;
	const end = content.indexOf('\n---\n', 4);
	if (end === -1) return content;
	return content.slice(end + 5);
}
