import type { TextDokumente } from './app';

export type EnrichedTextDokumente = TextDokumente & {
  quelle_audioName: string;
};
