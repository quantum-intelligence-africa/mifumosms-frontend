import { useEffect, useRef } from 'react';

/**
 * Custom hook that detects clicks outside of a referenced element
 * @param callback - Function to call when clicking outside
 * @param enabled - Whether the hook is enabled (default: true)
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
	callback: () => void,
	enabled: boolean = true
) {
	const ref = useRef<T>(null);

	useEffect(() => {
		if (!enabled) return;

		const handleClickOutside = (event: MouseEvent) => {
			if (ref.current && !ref.current.contains(event.target as Node)) {
				callback();
			}
		};

		// Add event listener
		document.addEventListener('mousedown', handleClickOutside);

		// Cleanup
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [callback, enabled]);

	return ref;
}
