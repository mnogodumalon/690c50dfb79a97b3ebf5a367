// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export interface Startseite {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    auswahl_aktion?: LookupValue;
  };
}

export interface AudioAufnahmen {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    titel?: string;
    aufnahmedatum?: string; // Format: YYYY-MM-DD oder ISO String
    audiodatei?: string;
    dokumenttyp?: LookupValue;
    notizen?: string;
  };
}

export interface TextDokumente {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    dokument_titel?: string;
    quelle_audio?: string; // applookup -> URL zu 'AudioAufnahmen' Record
    umwandlungsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    text_inhalt?: string;
    bearbeitungsnotizen?: string;
    standarddokument?: string;
  };
}

export const APP_IDS = {
  STARTSEITE: '69aa9e4c0893e1fceef2589d',
  AUDIO_AUFNAHMEN: '690c50c670415a9e4d1a70cd',
  TEXT_DOKUMENTE: '690c50caef7c15cf32d0901c',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  startseite: {
    auswahl_aktion: [{ key: "audio_aufnahmen", label: "Audio-Aufnahme hochladen" }, { key: "text_dokumente", label: "Text-Dokument erstellen" }],
  },
  audio_aufnahmen: {
    dokumenttyp: [{ key: "stellenbeschreibung", label: "Stellenbeschreibung" }, { key: "arbeitsanweisung", label: "Arbeitsanweisung" }, { key: "prozessbeschreibung", label: "Prozessbeschreibung" }, { key: "einfachedokumentation", label: "Einfache Dokumentation" }],
  },
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateStartseite = StripLookup<Startseite['fields']>;
export type CreateAudioAufnahmen = StripLookup<AudioAufnahmen['fields']>;
export type CreateTextDokumente = StripLookup<TextDokumente['fields']>;