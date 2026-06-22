import { App, TFile } from 'obsidian';
import { DEFAULT_CARDS_FOLDER, PREVIEW_LENGTH, ESTIMATE_SCALE } from '../constants';
import { Estimate } from '../types/Board';

/**
 * Where a new post-it note should be filed. The note's folder is derived as
 * `<cardsFolder>/<project>/<type>`, where the project is the folder the board
 * note lives in and the type is the board section the post-it is added to.
 */
export interface NoteContext {
	/** Path of the board note the post-it is being added to. */
	boardPath?: string;
	/** The board section/type the post-it belongs to (becomes a subfolder). */
	cardType?: string;
}

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

	/**
	 * Create a new content note for a post-it and return it. When a context is
	 * given, the note is filed under `<cardsFolder>/<project>/<type>`; otherwise
	 * it lands directly in the cards folder.
	 */
	async createNote(title: string, context?: NoteContext): Promise<TFile> {
		const folder = this.folderFor(context);
		await this.ensureFolder(folder);
		const safe = this.sanitize(title.trim()) || 'Untitled';
		const path = await this.uniquePath(`${folder}/${safe}.md`);
		// The post-it title is the file name, so the note body starts empty.
		return this.app.vault.create(path, '');
	}

	/**
	 * Rename a content note's file. The post-it title is the file name, so this
	 * is how a post-it is relabelled. Obsidian updates inbound wikilinks (incl.
	 * the board layout) automatically. Returns the same TFile (its path updates).
	 */
	async renameNote(file: TFile, newName: string): Promise<TFile> {
		const safe = this.sanitize(newName) || 'Untitled';
		if (safe === file.basename) return file;
		const dir = file.parent && file.parent.path !== '/' ? file.parent.path : '';
		const path = await this.uniquePath(dir ? `${dir}/${safe}.md` : `${safe}.md`);
		await this.app.fileManager.renameFile(file, path);
		return file;
	}

	/** Resolve the target folder for a new note: cardsFolder/<project>/<type>. */
	private folderFor(context?: NoteContext): string {
		const project = context?.boardPath ? this.projectName(context.boardPath) : '';
		const type = context?.cardType ? this.sanitize(context.cardType) : '';
		return [this.cardsFolder, project, type].filter(Boolean).join('/');
	}

	/** Project = the name of the folder the board note lives in. */
	private projectName(boardPath: string): string {
		const slash = boardPath.lastIndexOf('/');
		if (slash < 0) return '';
		const dir = boardPath.slice(0, slash);
		return this.sanitize(dir.slice(dir.lastIndexOf('/') + 1));
	}

	/** Strip characters that are illegal in note/folder names. */
	private sanitize(s: string): string {
		return s.trim().replace(/[\\/:*?"<>|#^[\]]/g, '-');
	}

	/**
	 * Markdown notes filed under the given card type(s) for the board's project,
	 * i.e. living exactly in `<cardsFolder>/<project>/<type>` — the same folder
	 * new notes of that type are created in. Used to scope the link picker so a
	 * "Jobs" slot only offers existing Jobs notes of the current project, while a
	 * slot that reuses several kinds of note (e.g. a Roadmap item, which holds
	 * stories and features) can pass multiple types. Untyped notes (sitting
	 * directly in the cards folder) are never matched. An empty/unknown type
	 * falls back to every markdown note.
	 */
	notesOfType(cardType: string | string[], boardPath?: string): TFile[] {
		const types = (Array.isArray(cardType) ? cardType : [cardType])
			.map((t) => this.sanitize(t))
			.filter(Boolean);
		if (types.length === 0) return this.app.vault.getMarkdownFiles();
		const folders = new Set(types.map((t) => this.folderFor({ boardPath, cardType: t })));
		return this.app.vault.getMarkdownFiles().filter((f) => f.parent != null && folders.has(f.parent.path));
	}

	/** Display title for a post-it: the note's file name. */
	getTitle(file: TFile): string {
		return file.basename;
	}

	/** A short body preview (frontmatter and leading H1 stripped). */
	async getPreview(file: TFile): Promise<string> {
		const raw = await this.app.vault.cachedRead(file);
		const body = stripFrontmatter(raw).replace(/^\s*#\s+.*\n?/, '').trim();
		if (body.length <= PREVIEW_LENGTH) return body;
		return body.slice(0, PREVIEW_LENGTH).trimEnd() + '…';
	}

	/**
	 * Read a story's Fibonacci estimate from its frontmatter `estimate:`, or null
	 * when absent or not a valid scale value. Read from the metadata cache.
	 */
	getEstimate(file: TFile): Estimate | null {
		const raw = this.app.metadataCache.getFileCache(file)?.frontmatter?.['estimate'];
		const n = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : NaN;
		return (ESTIMATE_SCALE as readonly number[]).includes(n) ? (n as Estimate) : null;
	}

	/**
	 * Set (value) or clear (null) a story's estimate. Writes ONLY the `estimate`
	 * frontmatter key via processFrontMatter; the note body is never rewritten.
	 */
	async setEstimate(file: TFile, value: Estimate | null): Promise<void> {
		await this.app.fileManager.processFrontMatter(file, (fm: Record<string, unknown>) => {
			if (value === null) delete fm['estimate'];
			else fm['estimate'] = value;
		});
	}

	/** Read a note's `agile-type` frontmatter field, or null when absent. */
	getAgileType(file: TFile): string | null {
		const raw = this.app.metadataCache.getFileCache(file)?.frontmatter?.['agile-type'];
		return typeof raw === 'string' && raw.trim() ? raw.trim() : null;
	}

	/** Read a story's Kanban column from its frontmatter `status:`, or null if absent. */
	getStatus(file: TFile): string | null {
		const raw = this.app.metadataCache.getFileCache(file)?.frontmatter?.['status'];
		return typeof raw === 'string' && raw.trim() ? raw.trim() : null;
	}

	/**
	 * Set (value) or clear (null) a story's Kanban column. Writes ONLY the `status`
	 * frontmatter key via processFrontMatter; the note body is never rewritten.
	 */
	async setStatus(file: TFile, value: string | null): Promise<void> {
		await this.app.fileManager.processFrontMatter(file, (fm: Record<string, unknown>) => {
			if (value === null) delete fm['status'];
			else fm['status'] = value;
		});
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
				try {
					await this.app.vault.createFolder(current);
				} catch {
					// Folder already exists on disk but not yet in memory index — safe to continue.
				}
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
