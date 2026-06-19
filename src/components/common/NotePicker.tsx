import { App, FuzzySuggestModal, TFile } from 'obsidian';

/** Fuzzy-search any vault note to link as a post-it (content notes are untyped). */
export class NotePickerModal extends FuzzySuggestModal<TFile> {
	constructor(app: App, private onChoose: (file: TFile) => void) {
		super(app);
		this.setPlaceholder('Link an existing note…');
	}

	getItems(): TFile[] {
		return this.app.vault.getMarkdownFiles();
	}

	getItemText(file: TFile): string {
		return file.path;
	}

	onChooseItem(file: TFile): void {
		this.onChoose(file);
	}
}

export function openNotePicker(app: App, onChoose: (file: TFile) => void): void {
	new NotePickerModal(app, onChoose).open();
}
