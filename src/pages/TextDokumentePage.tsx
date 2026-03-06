import { useState, useEffect } from 'react';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import type { TextDokumente, AudioAufnahmen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import { Pencil, Trash2, Plus, Search, ArrowUpDown, ArrowUp, ArrowDown, FileText } from 'lucide-react';
import { TextDokumenteDialog } from '@/components/dialogs/TextDokumenteDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PageShell } from '@/components/PageShell';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

export default function TextDokumentePage() {
  const [records, setRecords] = useState<TextDokumente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TextDokumente | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TextDokumente | null>(null);
  const [sortKey, setSortKey] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [audio_aufnahmenList, setAudioAufnahmenList] = useState<AudioAufnahmen[]>([]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [mainData, audio_aufnahmenData] = await Promise.all([
        LivingAppsService.getTextDokumente(),
        LivingAppsService.getAudioAufnahmen(),
      ]);
      setRecords(mainData);
      setAudioAufnahmenList(audio_aufnahmenData);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(fields: TextDokumente['fields']) {
    await LivingAppsService.createTextDokumenteEntry(fields);
    await loadData();
    setDialogOpen(false);
  }

  async function handleUpdate(fields: TextDokumente['fields']) {
    if (!editingRecord) return;
    await LivingAppsService.updateTextDokumenteEntry(editingRecord.record_id, fields);
    await loadData();
    setEditingRecord(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await LivingAppsService.deleteTextDokumenteEntry(deleteTarget.record_id);
    setRecords(prev => prev.filter(r => r.record_id !== deleteTarget.record_id));
    setDeleteTarget(null);
  }

  function getAudioAufnahmenDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return audio_aufnahmenList.find(r => r.record_id === id)?.fields.titel ?? '—';
  }

  const filtered = records.filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return Object.values(r.fields).some(v => {
      if (v == null) return false;
      if (Array.isArray(v)) return v.some(item => typeof item === 'object' && item !== null && 'label' in item ? String((item as any).label).toLowerCase().includes(s) : String(item).toLowerCase().includes(s));
      if (typeof v === 'object' && 'label' in (v as any)) return String((v as any).label).toLowerCase().includes(s);
      return String(v).toLowerCase().includes(s);
    });
  });

  function toggleSort(key: string) {
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc');
      else { setSortKey(''); setSortDir('asc'); }
    } else { setSortKey(key); setSortDir('asc'); }
  }

  function sortRecords<T extends { fields: Record<string, any> }>(recs: T[]): T[] {
    if (!sortKey) return recs;
    return [...recs].sort((a, b) => {
      let va: any = a.fields[sortKey], vb: any = b.fields[sortKey];
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === 'object' && 'label' in va) va = va.label;
      if (typeof vb === 'object' && 'label' in vb) vb = vb.label;
      if (typeof va === 'number' && typeof vb === 'number') return sortDir === 'asc' ? va - vb : vb - va;
      return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <PageShell
      title="Text-Dokumente"
      subtitle={`${records.length} Text-Dokumente im System`}
      action={
        <Button onClick={() => setDialogOpen(true)} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" /> Hinzufügen
        </Button>
      }
    >
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Text-Dokumente suchen..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('dokument_titel')}>
                <span className="inline-flex items-center gap-1">
                  Dokumenttitel
                  {sortKey === 'dokument_titel' ? (sortDir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('quelle_audio')}>
                <span className="inline-flex items-center gap-1">
                  Quelle Audio-Aufnahme
                  {sortKey === 'quelle_audio' ? (sortDir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('umwandlungsdatum')}>
                <span className="inline-flex items-center gap-1">
                  Umwandlungsdatum
                  {sortKey === 'umwandlungsdatum' ? (sortDir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('text_inhalt')}>
                <span className="inline-flex items-center gap-1">
                  Text-Inhalt
                  {sortKey === 'text_inhalt' ? (sortDir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('bearbeitungsnotizen')}>
                <span className="inline-flex items-center gap-1">
                  Bearbeitungsnotizen
                  {sortKey === 'bearbeitungsnotizen' ? (sortDir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('standarddokument')}>
                <span className="inline-flex items-center gap-1">
                  Umgewandeltes Dokument
                  {sortKey === 'standarddokument' ? (sortDir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="w-24">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortRecords(filtered).map(record => (
              <TableRow key={record.record_id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium">{record.fields.dokument_titel ?? '—'}</TableCell>
                <TableCell>{getAudioAufnahmenDisplayName(record.fields.quelle_audio)}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(record.fields.umwandlungsdatum)}</TableCell>
                <TableCell className="max-w-xs"><span className="truncate block">{record.fields.text_inhalt ?? '—'}</span></TableCell>
                <TableCell className="max-w-xs"><span className="truncate block">{record.fields.bearbeitungsnotizen ?? '—'}</span></TableCell>
                <TableCell>{record.fields.standarddokument ? <div className="relative h-8 w-8 rounded bg-muted overflow-hidden"><div className="absolute inset-0 flex items-center justify-center"><FileText size={14} className="text-muted-foreground" /></div><img src={record.fields.standarddokument} alt="" className="relative h-full w-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} /></div> : '—'}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditingRecord(record)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(record)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                  {search ? 'Keine Ergebnisse gefunden.' : 'Noch keine Text-Dokumente. Jetzt hinzufügen!'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <TextDokumenteDialog
        open={dialogOpen || !!editingRecord}
        onClose={() => { setDialogOpen(false); setEditingRecord(null); }}
        onSubmit={editingRecord ? handleUpdate : handleCreate}
        defaultValues={editingRecord?.fields}
        audio_aufnahmenList={audio_aufnahmenList}
        enablePhotoScan={AI_PHOTO_SCAN['TextDokumente']}
        enablePhotoLocation={AI_PHOTO_LOCATION['TextDokumente']}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Text-Dokumente löschen"
        description="Soll dieser Eintrag wirklich gelöscht werden? Diese Aktion kann nicht rückgängig gemacht werden."
      />
    </PageShell>
  );
}