import { createContext, useContext } from 'react';
import { App } from 'obsidian';
import { NoteService } from '../services/NoteService';
import { BoardService } from '../services/BoardService';
import { ReferenceService } from '../services/ReferenceService';
import { IndexService } from '../services/IndexService';

export interface PluginServices {
	noteService: NoteService;
	boardService: BoardService;
	referenceService: ReferenceService;
	indexService: IndexService;
}

interface AppContextValue {
	app: App;
	services: PluginServices;
}

export const AppContext = createContext<AppContextValue | null>(null);

export function useAppContext(): AppContextValue {
	const ctx = useContext(AppContext);
	if (!ctx) throw new Error('AppContext not provided');
	return ctx;
}

export function useApp(): App {
	return useAppContext().app;
}

export function useServices(): PluginServices {
	return useAppContext().services;
}
