import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Startseite, AudioAufnahmen, TextDokumente } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [startseite, setStartseite] = useState<Startseite[]>([]);
  const [audioAufnahmen, setAudioAufnahmen] = useState<AudioAufnahmen[]>([]);
  const [textDokumente, setTextDokumente] = useState<TextDokumente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [startseiteData, audioAufnahmenData, textDokumenteData] = await Promise.all([
        LivingAppsService.getStartseite(),
        LivingAppsService.getAudioAufnahmen(),
        LivingAppsService.getTextDokumente(),
      ]);
      setStartseite(startseiteData);
      setAudioAufnahmen(audioAufnahmenData);
      setTextDokumente(textDokumenteData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const audioAufnahmenMap = useMemo(() => {
    const m = new Map<string, AudioAufnahmen>();
    audioAufnahmen.forEach(r => m.set(r.record_id, r));
    return m;
  }, [audioAufnahmen]);

  return { startseite, setStartseite, audioAufnahmen, setAudioAufnahmen, textDokumente, setTextDokumente, loading, error, fetchAll, audioAufnahmenMap };
}