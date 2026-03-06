import { useState, useMemo, useCallback } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichTextDokumente } from '@/lib/enrich';
import type { AudioAufnahmen, TextDokumente } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import { formatDate } from '@/lib/formatters';
import { AI_PHOTO_SCAN } from '@/config/ai-features';
import { AudioAufnahmenDialog } from '@/components/dialogs/AudioAufnahmenDialog';
import { TextDokumenteDialog } from '@/components/dialogs/TextDokumenteDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { StatCard } from '@/components/StatCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Mic, FileText, Plus, Pencil, Trash2, AlertCircle,
  Search, ChevronRight, Calendar, Tag, StickyNote, FileOutput, Link2
} from 'lucide-react';

export default function DashboardOverview() {
  const {
    audioAufnahmen, textDokumente,
    audioAufnahmenMap,
    loading, error, fetchAll,
  } = useDashboardData();

  const enrichedTextDokumente = enrichTextDokumente(textDokumente, { audioAufnahmenMap });

  // UI state - ALL hooks must be before early returns
  const [selectedAudioId, setSelectedAudioId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [audioDialogOpen, setAudioDialogOpen] = useState(false);
  const [editAudio, setEditAudio] = useState<AudioAufnahmen | null>(null);
  const [deleteAudioTarget, setDeleteAudioTarget] = useState<AudioAufnahmen | null>(null);
  const [textDialogOpen, setTextDialogOpen] = useState(false);
  const [editText, setEditText] = useState<TextDokumente | null>(null);
  const [deleteTextTarget, setDeleteTextTarget] = useState<TextDokumente | null>(null);

  const filteredAudio = useMemo(() => {
    if (!search.trim()) return audioAufnahmen;
    const q = search.toLowerCase();
    return audioAufnahmen.filter(a =>
      (a.fields.titel ?? '').toLowerCase().includes(q) ||
      (a.fields.dokumenttyp?.label ?? '').toLowerCase().includes(q) ||
      (a.fields.notizen ?? '').toLowerCase().includes(q)
    );
  }, [audioAufnahmen, search]);

  const linkedDocs = useMemo(() => {
    if (!selectedAudioId) return [];
    return enrichedTextDokumente.filter(d => {
      const id = extractRecordId(d.fields.quelle_audio);
      return id === selectedAudioId;
    });
  }, [selectedAudioId, enrichedTextDokumente]);

  const selectedAudio = useMemo(() =>
    selectedAudioId ? audioAufnahmenMap.get(selectedAudioId) ?? null : null,
    [selectedAudioId, audioAufnahmenMap]
  );

  const handleSelectAudio = useCallback((id: string) => {
    setSelectedAudioId(prev => prev === id ? null : id);
  }, []);

  const handleCreateAudio = useCallback(async (fields: AudioAufnahmen['fields']) => {
    await LivingAppsService.createAudioAufnahmenEntry(fields);
    fetchAll();
  }, [fetchAll]);

  const handleUpdateAudio = useCallback(async (fields: AudioAufnahmen['fields']) => {
    if (!editAudio) return;
    await LivingAppsService.updateAudioAufnahmenEntry(editAudio.record_id, fields);
    fetchAll();
  }, [editAudio, fetchAll]);

  const handleDeleteAudio = useCallback(async () => {
    if (!deleteAudioTarget) return;
    await LivingAppsService.deleteAudioAufnahmenEntry(deleteAudioTarget.record_id);
    if (selectedAudioId === deleteAudioTarget.record_id) setSelectedAudioId(null);
    fetchAll();
    setDeleteAudioTarget(null);
  }, [deleteAudioTarget, selectedAudioId, fetchAll]);

  const handleCreateText = useCallback(async (fields: TextDokumente['fields']) => {
    await LivingAppsService.createTextDokumenteEntry(fields);
    fetchAll();
  }, [fetchAll]);

  const handleUpdateText = useCallback(async (fields: TextDokumente['fields']) => {
    if (!editText) return;
    await LivingAppsService.updateTextDokumenteEntry(editText.record_id, fields);
    fetchAll();
  }, [editText, fetchAll]);

  const handleDeleteText = useCallback(async () => {
    if (!deleteTextTarget) return;
    await LivingAppsService.deleteTextDokumenteEntry(deleteTextTarget.record_id);
    fetchAll();
    setDeleteTextTarget(null);
  }, [deleteTextTarget, fetchAll]);

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  const docsWithoutAudio = enrichedTextDokumente.filter(d => !d.fields.quelle_audio);

  return (
    <div className="space-y-6">
      {/* Header + Stats */}
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">Sprache-zu-Text</h1>
        <p className="text-sm text-muted-foreground">Audio-Aufnahmen aufnehmen und in Text umwandeln</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Aufnahmen"
          value={String(audioAufnahmen.length)}
          description="Audio-Dateien"
          icon={<Mic size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Dokumente"
          value={String(textDokumente.length)}
          description="Text-Dokumente"
          icon={<FileText size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Verknüpft"
          value={String(textDokumente.filter(d => d.fields.quelle_audio).length)}
          description="Mit Aufnahme verknüpft"
          icon={<Link2 size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Ohne Quelle"
          value={String(docsWithoutAudio.length)}
          description="Eigenständige Dokumente"
          icon={<FileOutput size={18} className="text-muted-foreground" />}
        />
      </div>

      {/* Master-Detail Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 min-h-[560px]">

        {/* LEFT: Audio Recordings List */}
        <div className="lg:col-span-2 flex flex-col rounded-2xl border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
            <span className="font-semibold text-sm flex items-center gap-2">
              <Mic size={15} className="text-primary" />
              Audio-Aufnahmen
              <Badge variant="secondary" className="text-xs">{audioAufnahmen.length}</Badge>
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 gap-1 text-xs"
              onClick={() => { setEditAudio(null); setAudioDialogOpen(true); }}
            >
              <Plus size={13} /> Neu
            </Button>
          </div>

          <div className="px-3 py-2 border-b">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Suchen..."
                className="h-8 pl-8 text-xs"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredAudio.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <Mic size={18} className="text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {search ? 'Keine Ergebnisse' : 'Noch keine Aufnahmen'}
                </p>
                {!search && (
                  <Button size="sm" variant="outline" onClick={() => { setEditAudio(null); setAudioDialogOpen(true); }}>
                    <Plus size={13} className="mr-1" /> Aufnahme hinzufügen
                  </Button>
                )}
              </div>
            ) : (
              <div className="divide-y">
                {filteredAudio.map(audio => {
                  const isSelected = selectedAudioId === audio.record_id;
                  const docCount = enrichedTextDokumente.filter(d => extractRecordId(d.fields.quelle_audio) === audio.record_id).length;
                  return (
                    <div
                      key={audio.record_id}
                      onClick={() => handleSelectAudio(audio.record_id)}
                      className={`group px-4 py-3 cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-primary/8 border-l-2 border-l-primary'
                          : 'hover:bg-muted/40 border-l-2 border-l-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`font-medium text-sm truncate ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                              {audio.fields.titel ?? '(Kein Titel)'}
                            </span>
                            {docCount > 0 && (
                              <Badge variant="secondary" className="text-xs shrink-0">{docCount} Dok.</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {audio.fields.dokumenttyp && (
                              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                {audio.fields.dokumenttyp.label}
                              </span>
                            )}
                            {audio.fields.aufnahmedatum && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar size={10} />
                                {formatDate(audio.fields.aufnahmedatum)}
                              </span>
                            )}
                          </div>
                          {audio.fields.audiodatei && (
                            <div className="mt-1.5">
                              <audio
                                src={audio.fields.audiodatei}
                                controls
                                className="h-7 w-full max-w-[220px]"
                                onClick={e => e.stopPropagation()}
                              />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={e => { e.stopPropagation(); setEditAudio(audio); setAudioDialogOpen(true); }}
                          >
                            <Pencil size={11} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                            onClick={e => { e.stopPropagation(); setDeleteAudioTarget(audio); }}
                          >
                            <Trash2 size={11} />
                          </Button>
                          <ChevronRight size={14} className={`text-muted-foreground transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Detail / Linked Documents */}
        <div className="lg:col-span-3 flex flex-col rounded-2xl border bg-card overflow-hidden">
          {!selectedAudio ? (
            <div className="flex flex-col items-center justify-center h-full py-16 gap-3">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                <FileText size={22} className="text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="font-medium text-sm text-foreground mb-1">Audio-Aufnahme auswählen</p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Wählen Sie links eine Aufnahme aus, um die verknüpften Text-Dokumente anzuzeigen.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Audio detail header */}
              <div className="px-5 py-4 border-b bg-muted/20">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Mic size={15} className="text-primary shrink-0" />
                      <h2 className="font-bold text-base text-foreground truncate">
                        {selectedAudio.fields.titel ?? '(Kein Titel)'}
                      </h2>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {selectedAudio.fields.aufnahmedatum && (
                        <span className="flex items-center gap-1">
                          <Calendar size={11} /> {formatDate(selectedAudio.fields.aufnahmedatum)}
                        </span>
                      )}
                      {selectedAudio.fields.dokumenttyp && (
                        <span className="flex items-center gap-1">
                          <Tag size={11} /> {selectedAudio.fields.dokumenttyp.label}
                        </span>
                      )}
                    </div>
                    {selectedAudio.fields.notizen && (
                      <p className="mt-2 text-xs text-muted-foreground flex items-start gap-1">
                        <StickyNote size={11} className="mt-0.5 shrink-0" />
                        {selectedAudio.fields.notizen}
                      </p>
                    )}
                    {selectedAudio.fields.audiodatei && (
                      <div className="mt-2">
                        <audio src={selectedAudio.fields.audiodatei} controls className="h-8 w-full max-w-sm" />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => { setEditAudio(selectedAudio); setAudioDialogOpen(true); }}
                    >
                      <Pencil size={13} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => setDeleteAudioTarget(selectedAudio)}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Linked documents */}
              <div className="flex items-center justify-between px-5 py-2.5 border-b">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <FileText size={12} />
                  Verknüpfte Dokumente
                  <Badge variant="secondary" className="text-xs normal-case tracking-normal">{linkedDocs.length}</Badge>
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2.5 gap-1 text-xs"
                  onClick={() => { setEditText(null); setTextDialogOpen(true); }}
                >
                  <Plus size={12} /> Dokument
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {linkedDocs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                      <FileText size={18} className="text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground">Noch keine Dokumente verknüpft</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setEditText(null); setTextDialogOpen(true); }}
                    >
                      <Plus size={13} className="mr-1" /> Dokument erstellen
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y">
                    {linkedDocs.map(doc => (
                      <div key={doc.record_id} className="group px-5 py-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <FileText size={13} className="text-primary shrink-0" />
                              <span className="font-semibold text-sm text-foreground truncate">
                                {doc.fields.dokument_titel ?? '(Kein Titel)'}
                              </span>
                            </div>
                            {doc.fields.umwandlungsdatum && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                                <Calendar size={10} /> {formatDate(doc.fields.umwandlungsdatum)}
                              </p>
                            )}
                            {doc.fields.text_inhalt && (
                              <div className="bg-muted/40 rounded-lg px-3 py-2 mt-1">
                                <p className="text-xs text-foreground leading-relaxed line-clamp-4 whitespace-pre-wrap">
                                  {doc.fields.text_inhalt}
                                </p>
                              </div>
                            )}
                            {doc.fields.bearbeitungsnotizen && (
                              <p className="mt-2 text-xs text-muted-foreground flex items-start gap-1">
                                <StickyNote size={11} className="mt-0.5 shrink-0" />
                                {doc.fields.bearbeitungsnotizen}
                              </p>
                            )}
                            {doc.fields.standarddokument && (
                              <a
                                href={doc.fields.standarddokument}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:underline"
                                onClick={e => e.stopPropagation()}
                              >
                                <FileOutput size={11} /> Dokument öffnen
                              </a>
                            )}
                          </div>
                          <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => { setEditText(doc); setTextDialogOpen(true); }}
                            >
                              <Pencil size={11} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={() => setDeleteTextTarget(doc)}
                            >
                              <Trash2 size={11} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Unlinked documents section */}
      {docsWithoutAudio.length > 0 && (
        <div className="rounded-2xl border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
            <span className="font-semibold text-sm flex items-center gap-2">
              <FileText size={15} className="text-muted-foreground" />
              Eigenständige Dokumente
              <Badge variant="secondary" className="text-xs">{docsWithoutAudio.length}</Badge>
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 gap-1 text-xs"
              onClick={() => { setEditText(null); setTextDialogOpen(true); }}
            >
              <Plus size={13} /> Neu
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x">
            {docsWithoutAudio.map(doc => (
              <div key={doc.record_id} className="group p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-medium text-sm truncate">
                    {doc.fields.dokument_titel ?? '(Kein Titel)'}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => { setEditText(doc); setTextDialogOpen(true); }}>
                      <Pencil size={10} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive hover:text-destructive" onClick={() => setDeleteTextTarget(doc)}>
                      <Trash2 size={10} />
                    </Button>
                  </div>
                </div>
                {doc.fields.text_inhalt && (
                  <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                    {doc.fields.text_inhalt}
                  </p>
                )}
                {doc.fields.umwandlungsdatum && (
                  <p className="mt-2 text-xs text-muted-foreground/60 flex items-center gap-1">
                    <Calendar size={9} /> {formatDate(doc.fields.umwandlungsdatum)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dialogs */}
      <AudioAufnahmenDialog
        open={audioDialogOpen}
        onClose={() => { setAudioDialogOpen(false); setEditAudio(null); }}
        onSubmit={editAudio ? handleUpdateAudio : handleCreateAudio}
        defaultValues={editAudio?.fields}
        enablePhotoScan={AI_PHOTO_SCAN['AudioAufnahmen']}
      />

      <TextDokumenteDialog
        open={textDialogOpen}
        onClose={() => { setTextDialogOpen(false); setEditText(null); }}
        onSubmit={editText ? handleUpdateText : handleCreateText}
        defaultValues={editText
          ? {
              ...editText.fields,
              quelle_audio: selectedAudioId && !editText.fields.quelle_audio
                ? createRecordUrl(APP_IDS.AUDIO_AUFNAHMEN, selectedAudioId)
                : editText.fields.quelle_audio,
            }
          : selectedAudioId
            ? { quelle_audio: createRecordUrl(APP_IDS.AUDIO_AUFNAHMEN, selectedAudioId) }
            : undefined
        }
        audio_aufnahmenList={audioAufnahmen}
        enablePhotoScan={AI_PHOTO_SCAN['TextDokumente']}
      />

      <ConfirmDialog
        open={!!deleteAudioTarget}
        title="Aufnahme löschen"
        description={`„${deleteAudioTarget?.fields.titel ?? 'Aufnahme'}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
        onConfirm={handleDeleteAudio}
        onClose={() => setDeleteAudioTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteTextTarget}
        title="Dokument löschen"
        description={`„${deleteTextTarget?.fields.dokument_titel ?? 'Dokument'}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
        onConfirm={handleDeleteText}
        onClose={() => setDeleteTextTarget(null)}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Skeleton className="lg:col-span-2 h-96 rounded-2xl" />
        <Skeleton className="lg:col-span-3 h-96 rounded-2xl" />
      </div>
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <AlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">{error.message}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>Erneut versuchen</Button>
    </div>
  );
}
