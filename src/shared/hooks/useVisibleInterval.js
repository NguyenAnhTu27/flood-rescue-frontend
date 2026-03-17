import { useEffect, useRef } from 'react';

export function useVisibleInterval(callback, delay) {
    const savedCallback = useRef(callback);

    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    useEffect(() => {
        if (typeof delay !== 'number' || delay <= 0) return undefined;

        let intervalId = null;

        const tick = () => {
            if (document.visibilityState !== 'visible') return;
            if (typeof savedCallback.current === 'function') {
                savedCallback.current();
            }
        };

        intervalId = window.setInterval(tick, delay);

        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                tick();
            }
        };

        document.addEventListener('visibilitychange', handleVisibility);
        return () => {
            if (intervalId) window.clearInterval(intervalId);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, [delay]);
}

