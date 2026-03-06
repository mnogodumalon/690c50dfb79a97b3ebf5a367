import type { EnrichedTextDokumente } from '@/types/enriched';
import type { AudioAufnahmen, TextDokumente } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface TextDokumenteMaps {
  audioAufnahmenMap: Map<string, AudioAufnahmen>;
}

export function enrichTextDokumente(
  textDokumente: TextDokumente[],
  maps: TextDokumenteMaps
): EnrichedTextDokumente[] {
  return textDokumente.map(r => ({
    ...r,
    quelle_audioName: resolveDisplay(r.fields.quelle_audio, maps.audioAufnahmenMap, 'titel'),
  }));
}
