// AUTOMATICALLY GENERATED SERVICE
import { APP_IDS, LOOKUP_OPTIONS } from '@/types/app';
import type { Startseite, AudioAufnahmen, TextDokumente } from '@/types/app';

// Base Configuration
const API_BASE_URL = 'https://my.living-apps.de/rest';

// --- HELPER FUNCTIONS ---
export function extractRecordId(url: unknown): string | null {
  if (!url) return null;
  if (typeof url !== 'string') return null;
  const match = url.match(/([a-f0-9]{24})$/i);
  return match ? match[1] : null;
}

export function createRecordUrl(appId: string, recordId: string): string {
  return `https://my.living-apps.de/rest/apps/${appId}/records/${recordId}`;
}

async function callApi(method: string, endpoint: string, data?: any) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',  // Nutze Session Cookies für Auth
    body: data ? JSON.stringify(data) : undefined
  });
  if (!response.ok) throw new Error(await response.text());
  // DELETE returns often empty body or simple status
  if (method === 'DELETE') return true;
  return response.json();
}

/** Upload a file to LivingApps. Returns the file URL for use in record fields. */
export async function uploadFile(file: File | Blob, filename?: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file, filename ?? (file instanceof File ? file.name : 'upload'));
  const res = await fetch(`${API_BASE_URL}/files`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  if (!res.ok) throw new Error(`File upload failed: ${res.status}`);
  const data = await res.json();
  return data.url;
}

function enrichLookupFields<T extends { fields: Record<string, unknown> }>(
  records: T[], entityKey: string
): T[] {
  const opts = LOOKUP_OPTIONS[entityKey];
  if (!opts) return records;
  return records.map(r => {
    const fields = { ...r.fields };
    for (const [fieldKey, options] of Object.entries(opts)) {
      const val = fields[fieldKey];
      if (typeof val === 'string') {
        const m = options.find(o => o.key === val);
        fields[fieldKey] = m ?? { key: val, label: val };
      } else if (Array.isArray(val)) {
        fields[fieldKey] = val.map(v => {
          if (typeof v === 'string') {
            const m = options.find(o => o.key === v);
            return m ?? { key: v, label: v };
          }
          return v;
        });
      }
    }
    return { ...r, fields } as T;
  });
}

export class LivingAppsService {
  // --- STARTSEITE ---
  static async getStartseite(): Promise<Startseite[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.STARTSEITE}/records`);
    const records = Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    })) as Startseite[];
    return enrichLookupFields(records, 'startseite');
  }
  static async getStartseiteEntry(id: string): Promise<Startseite | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.STARTSEITE}/records/${id}`);
    const record = { record_id: data.id, ...data } as Startseite;
    return enrichLookupFields([record], 'startseite')[0];
  }
  static async createStartseiteEntry(fields: Startseite['fields']) {
    return callApi('POST', `/apps/${APP_IDS.STARTSEITE}/records`, { fields });
  }
  static async updateStartseiteEntry(id: string, fields: Partial<Startseite['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.STARTSEITE}/records/${id}`, { fields });
  }
  static async deleteStartseiteEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.STARTSEITE}/records/${id}`);
  }

  // --- AUDIO_AUFNAHMEN ---
  static async getAudioAufnahmen(): Promise<AudioAufnahmen[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.AUDIO_AUFNAHMEN}/records`);
    const records = Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    })) as AudioAufnahmen[];
    return enrichLookupFields(records, 'audio_aufnahmen');
  }
  static async getAudioAufnahmenEntry(id: string): Promise<AudioAufnahmen | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.AUDIO_AUFNAHMEN}/records/${id}`);
    const record = { record_id: data.id, ...data } as AudioAufnahmen;
    return enrichLookupFields([record], 'audio_aufnahmen')[0];
  }
  static async createAudioAufnahmenEntry(fields: AudioAufnahmen['fields']) {
    return callApi('POST', `/apps/${APP_IDS.AUDIO_AUFNAHMEN}/records`, { fields });
  }
  static async updateAudioAufnahmenEntry(id: string, fields: Partial<AudioAufnahmen['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.AUDIO_AUFNAHMEN}/records/${id}`, { fields });
  }
  static async deleteAudioAufnahmenEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.AUDIO_AUFNAHMEN}/records/${id}`);
  }

  // --- TEXT_DOKUMENTE ---
  static async getTextDokumente(): Promise<TextDokumente[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.TEXT_DOKUMENTE}/records`);
    const records = Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    })) as TextDokumente[];
    return enrichLookupFields(records, 'text_dokumente');
  }
  static async getTextDokumenteEntry(id: string): Promise<TextDokumente | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.TEXT_DOKUMENTE}/records/${id}`);
    const record = { record_id: data.id, ...data } as TextDokumente;
    return enrichLookupFields([record], 'text_dokumente')[0];
  }
  static async createTextDokumenteEntry(fields: TextDokumente['fields']) {
    return callApi('POST', `/apps/${APP_IDS.TEXT_DOKUMENTE}/records`, { fields });
  }
  static async updateTextDokumenteEntry(id: string, fields: Partial<TextDokumente['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.TEXT_DOKUMENTE}/records/${id}`, { fields });
  }
  static async deleteTextDokumenteEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.TEXT_DOKUMENTE}/records/${id}`);
  }

}