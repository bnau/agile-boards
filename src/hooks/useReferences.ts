import { useMemo } from 'react';
import { AgileCard } from '../types/Card';
import { useServices } from '../context/AppContext';

export function useReferences(refs: string[]): AgileCard[] {
	const { referenceService } = useServices();
	return useMemo(() => referenceService.resolveAll(refs), [referenceService, refs]);
}

export function useReference(ref: string): AgileCard | undefined {
	const { referenceService } = useServices();
	return useMemo(() => referenceService.resolve(ref), [referenceService, ref]);
}
