import { useState, useEffect } from 'react';
import { AgileCard, CardType } from '../types/Card';
import { useServices } from '../context/AppContext';

export function useCards(type: CardType): AgileCard[] {
	const { indexService } = useServices();
	const [cards, setCards] = useState<AgileCard[]>(() => indexService.getCardsByType(type));

	useEffect(() => {
		setCards(indexService.getCardsByType(type));
		const unsubscribe = indexService.subscribe(() => {
			setCards(indexService.getCardsByType(type));
		});
		return unsubscribe;
	}, [indexService, type]);

	return cards;
}

export function useAllCards(): AgileCard[] {
	const { indexService } = useServices();
	const [cards, setCards] = useState<AgileCard[]>(() => indexService.getAllCards());

	useEffect(() => {
		setCards(indexService.getAllCards());
		const unsubscribe = indexService.subscribe(() => {
			setCards(indexService.getAllCards());
		});
		return unsubscribe;
	}, [indexService]);

	return cards;
}
