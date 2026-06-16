import { AgileCard } from '../types/Card';
import { IndexService } from './IndexService';

export class ReferenceService {
	constructor(private indexService: IndexService) {}

	/** Convert a wikilink "[[Title]]" or a path to a resolved AgileCard. */
	resolve(ref: string): AgileCard | undefined {
		if (!ref) return undefined;

		// Direct path match
		const byPath = this.indexService.getCardByPath(ref);
		if (byPath) return byPath;

		// Wikilink extraction: [[Title]] or [[path|alias]]
		const wikilinkMatch = ref.match(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/);
		const target = wikilinkMatch ? wikilinkMatch[1].trim() : ref;

		// Search all cards by title (basename without extension)
		for (const card of this.indexService.getAllCards()) {
			if (card.title === target || card.path === target || card.path.endsWith(`/${target}.md`)) {
				return card;
			}
		}
		return undefined;
	}

	resolveAll(refs: string[]): AgileCard[] {
		return refs.flatMap((r) => {
			const card = this.resolve(r);
			return card ? [card] : [];
		});
	}

	/** Create a wikilink string for a card. */
	toWikilink(card: AgileCard): string {
		return `[[${card.title}]]`;
	}

	/** Check whether a reference string resolves to an existing card. */
	isValid(ref: string): boolean {
		return this.resolve(ref) !== undefined;
	}
}
