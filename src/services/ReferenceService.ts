import { App, TFile } from 'obsidian';

/**
 * Resolves board-layout references (wikilinks) to vault notes, and builds
 * wikilinks for notes. A reference that does not resolve is reported as missing
 * so boards can show a non-destructive "missing note" indicator.
 */
export class ReferenceService {
	constructor(private app: App) {}

	/** Extract the link target from "[[Target]]" / "[[Target|Alias]]"; passthrough otherwise. */
	linkpath(ref: string): string {
		const m = ref.match(/\[\[([^\]|#]+)(?:[#|][^\]]*)?\]\]/);
		return (m ? m[1] : ref).trim();
	}

	/** Resolve a reference to a TFile relative to the board, or null if missing. */
	resolve(ref: string, sourcePath = ''): TFile | null {
		if (!ref) return null;
		return this.app.metadataCache.getFirstLinkpathDest(this.linkpath(ref), sourcePath);
	}

	isValid(ref: string, sourcePath = ''): boolean {
		return this.resolve(ref, sourcePath) !== null;
	}

	/** Build a wikilink for a note (uses the shortest unique link form). */
	toWikilink(file: TFile, sourcePath = ''): string {
		const linktext = this.app.metadataCache.fileToLinktext(file, sourcePath);
		return `[[${linktext}]]`;
	}

	/** Human-readable label for an (possibly missing) reference. */
	label(ref: string): string {
		return this.linkpath(ref).split('/').pop() ?? ref;
	}
}
