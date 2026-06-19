import { App, FuzzySuggestModal, TFile } from 'obsidian';

interface NotePickerOptions {
	/** Restrict the choices to this list (e.g. notes of a given card type). */
	items?: TFile[];
	/** Card type, used only to label the prompt. */
	cardType?: string;
}

/** Fuzzy-search existing notes to link as a post-it, optionally scoped to a card type. */
export class NotePickerModal extends FuzzySuggestModal<TFile> {
	constructor(app: App, private onChoose: (file: TFile) => void, private options: NotePickerOptions = {}) {
		super(app);
		this.setPlaceholder(
			options.cardType ? `Link an existing ${options.cardType}…` : 'Link an existing note…',
		);
	}

	getItems(): TFile[] {
		return this.options.items ?? this.app.vault.getMarkdownFiles();
	}

	getItemText(file: TFile): string {
		return file.path;
	}

	onChooseItem(file: TFile): void {
		this.onChoose(file);
	}
}

export function openNotePicker(
	app: App,
	onChoose: (file: TFile) => void,
	options: NotePickerOptions = {},
): void {
	new NotePickerModal(app, onChoose, options).open();
}
