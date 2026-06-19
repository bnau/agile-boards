import { useState, useEffect } from 'react';
import { TFile } from 'obsidian';
import { useApp, useServices } from '../context/AppContext';

export interface NotePreview {
	file: TFile | null;
	title: string;
	preview: string;
	missing: boolean;
	loading: boolean;
}

/**
 * Resolve a board-layout reference to its content note and derive a display
 * title + body preview. Re-renders when the underlying note (or its metadata)
 * changes, so post-its always reflect current content.
 */
export function useNotePreview(ref: string, sourcePath: string): NotePreview {
	const app = useApp();
	const { referenceService, noteService } = useServices();

	const [state, setState] = useState<NotePreview>({
		file: null, title: referenceService.label(ref), preview: '', missing: false, loading: true,
	});

	useEffect(() => {
		let cancelled = false;
		let isMissing = false;

		const load = async () => {
			const file = referenceService.resolve(ref, sourcePath);
			if (!file) {
				isMissing = true;
				if (!cancelled) setState({ file: null, title: referenceService.label(ref), preview: '', missing: true, loading: false });
				return;
			}
			isMissing = false;
			const title = noteService.getTitle(file);
			const preview = await noteService.getPreview(file);
			if (!cancelled) setState({ file, title, preview, missing: false, loading: false });
		};

		load();

		const onMeta = (file: TFile) => {
			const resolved = referenceService.resolve(ref, sourcePath);
			if (resolved && file.path === resolved.path) load();
		};
		// While unresolved, a global metadata resolution may make this ref valid
		// (e.g. after quick-create). Only re-check then, to avoid churn.
		const onResolved = () => { if (isMissing) load(); };

		const metaRef = app.metadataCache.on('changed', onMeta);
		const resolvedRef = app.metadataCache.on('resolved', onResolved);
		return () => {
			cancelled = true;
			app.metadataCache.offref(metaRef);
			app.metadataCache.offref(resolvedRef);
		};
	}, [app, ref, sourcePath, referenceService, noteService]);

	return state;
}
