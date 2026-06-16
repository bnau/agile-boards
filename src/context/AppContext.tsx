import { createContext, useContext } from 'react';
import { App } from 'obsidian';
import { CardService } from '../services/CardService';
import { IndexService } from '../services/IndexService';
import { ReferenceService } from '../services/ReferenceService';
import { BoardService } from '../services/BoardService';

export interface PluginServices {
	cardService: CardService;
	indexService: IndexService;
	referenceService: ReferenceService;
	boardService: BoardService;
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
