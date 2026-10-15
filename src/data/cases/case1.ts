import type { CaseDefinition, Clue, HotspotTask, VocabId } from '../../types'
import { missionHints } from './helpers'

const clues: Clue[] = [
  { id: 'c1-container', ar: 'هَذِهِ حَاوِيَةٌ.', note: 'Ini kontainer.', entity: 'container', vocab: ['container'], isEvidence: true },
  { id: 'c1-crane', ar: 'هَذِهِ رَافِعَةٌ.', note: 'Ini derek.', entity: 'crane', vocab: ['crane'], isEvidence: true },
  { id: 'c1-warehouse', ar: 'هَذَا مَخْزَنٌ.', note: 'Ini gudang.', entity: 'warehouse', vocab: ['warehouse'], isEvidence: true },
  { id: 'c1-lifeboat', ar: 'هَذَا قَارِبُ النَّجَاةِ.', note: 'Ini sekoci.', entity: 'lifeboat', vocab: ['lifeboat'], isEvidence: true },
  { id: 'c1-buoy', ar: 'هَذِهِ عَوَّامَةٌ.', note: 'Ini pelampung.', entity: 'buoy', vocab: ['buoy'], isEvidence: true },
  { id: 'c1-cargo', ar: 'هَذِهِ بِضَاعَةٌ.', note: 'Ini barang / muatan.', entity: 'cargo', vocab: ['cargo'], isEvidence: true },
  {
    id: 'c1-manifest', ar: 'الْبِضَاعَةُ فِي الْمِينَاءِ.', note: 'Barang masih berada di pelabuhan.',
    entity: 'clipboard', vocab: ['cargo', 'fi'], isEvidence: true, hidden: true,
  },
]

const bonus = { entity: 'clipboard' as const, clueId: 'c1-manifest' }

function mission(n: number, v: VocabId, promptAr: string, def: string): HotspotTask {
  return {
    id: `c1-t${n}`,
    type: 'hotspot',
    titleId: `Misi ${n}`,
    instruction: 'Ketuk benda di dermaga yang dimaksud perintah.',
    promptAr,
    focusText: promptAr,
    vocab: [v],
    target: v,
    clueId: `c1-${v}`,
    collects: [`c1-${v}`],
    hints: missionHints(v, def),
    success: 'Benar. Benda itu cocok dengan kata dalam perintah, dan kini tercatat sebagai bukti.',
    bonus,
  }
}

export const case1: CaseDefinition = {
  id: 'case-1',
  number: 1,
  titleAr: 'الْمَفْقُودُ',
  titleId: 'The Missing Object',
  description: 'Kenali benda-benda dermaga lewat perintah tertulis Arab.',
  story:
    'Manifes muatan Pelabuhan Al-Mina hilang. Tanpa daftar itu, tak ada yang tahu benda apa saja yang ada di dermaga. Tugas pertamamu: kenali benda-benda penting berdasarkan perintah tertulis, lalu temukan barang yang dilaporkan hilang.',
  difficulty: 1,
  learningLevel: 'Pengenalan (Recognition)',
  mechanic: 'Hotspot pada pemandangan dermaga',
  objectives: [
    'Membaca perintah Arab pendek',
    'Mengenali 6 kosakata pelabuhan dari gambar',
    'Menemukan bukti tersembunyi di dermaga',
  ],
  vocabulary: ['container', 'crane', 'warehouse', 'lifeboat', 'buoy', 'cargo'],
  showVocabMeaning: false,
  clues,
  tasks: [
    mission(1, 'container', 'اِبْحَثْ عَنِ الْحَاوِيَةِ', 'الْحَاوِيَةِ'),
    mission(2, 'crane', 'اِبْحَثْ عَنِ الرَّافِعَةِ', 'الرَّافِعَةِ'),
    mission(3, 'warehouse', 'اِبْحَثْ عَنِ الْمَخْزَنِ', 'الْمَخْزَنِ'),
    mission(4, 'lifeboat', 'اِبْحَثْ عَنْ قَارِبِ النَّجَاةِ', 'قَارِبِ النَّجَاةِ'),
    mission(5, 'buoy', 'اِبْحَثْ عَنِ الْعَوَّامَةِ', 'الْعَوَّامَةِ'),
    mission(6, 'cargo', 'اِبْحَثْ عَنِ الْبِضَاعَةِ', 'الْبِضَاعَةِ'),
  ],
  solution: {
    summary: 'Semua benda utama di dermaga berhasil dikenali; barang yang dilaporkan hilang ternyata masih ada di pelabuhan.',
    evidenceIds: clues.map((c) => c.id),
  },
}
