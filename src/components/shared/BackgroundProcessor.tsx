import { useEffect, useRef } from 'react';
import { useSettingsContext } from '../../contexts/SettingsContext';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { DATA_EVENTS } from '../../lib/db/repository';

/**
 * Robust background processor that offloads AI tasks (classification, embedding)
 * to a dedicated Web Worker. This ensures the main thread stays responsive.
 */
export function BackgroundProcessor() {
  const { settings } = useSettingsContext();
  const online = useNetworkStatus();
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // Initialize worker
    const worker = new Worker(
      new URL('../../lib/worker/processor.worker.ts', import.meta.url),
      { type: 'module' }
    );
    
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const { type, id } = e.data;
      if (type === 'ENTRY_PROCESSED') {
        // Notify the rest of the app that an entry has been updated
        window.dispatchEvent(new CustomEvent(DATA_EVENTS.ENTRY_SAVED, { detail: id }));
      }
    };

    // Delay start to prioritize initial page load
    const timer = window.setTimeout(() => {
      worker.postMessage({ type: 'START' });
    }, 5000);

    return () => {
      window.clearTimeout(timer);
      worker.postMessage({ type: 'STOP' });
      worker.terminate();
    };
  }, []);

  // Sync settings to worker
  useEffect(() => {
    workerRef.current?.postMessage({ type: 'UPDATE_SETTINGS', payload: settings });
  }, [settings]);

  // Sync online status to worker
  useEffect(() => {
    workerRef.current?.postMessage({ type: 'UPDATE_ONLINE_STATUS', payload: online });
  }, [online]);

  return null;
}
