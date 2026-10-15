import type { CaseDefinition, Clue, MapDef, MiniMapOption, PlacementTask, SceneChoiceTask } from '../../types'

const clues: Clue[] = [
  { id: 'c2-k1', ar: 'الْعَوَّامَةُ بِجَانِبِ قَارِبِ النَّجَاةِ.', note: 'Pelampung berada di samping sekoci.', entity: 'buoy', vocab: ['buoy', 'lifeboat', 'bijanib'], isEvidence: true },
  { id: 'c2-k2', ar: 'الْحَاوِيَةُ أَمَامَ الْمَخْزَنِ.', note: 'Kontainer berada di depan gudang.', entity: 'container', vocab: ['container', 'warehouse', 'amama'], isEvidence: true },
  { id: 'c2-k3', ar: 'الْحَاوِيَةُ خَلْفَ الْمَخْزَنِ.', note: 'Kontainer berada di belakang gudang.', entity: 'container', vocab: ['container', 'warehouse', 'khalfa'], isEvidence: true },
  { id: 'c2-k4', ar: 'الْعَوَّامَةُ بِجَانِبِ الرَّافِعَةِ.', note: 'Pelampung berada di samping derek.', entity: 'buoy', vocab: ['buoy', 'crane', 'bijanib'], isEvidence: true },
  { id: 'c2-k5', ar: 'الْبِضَاعَةُ بَيْنَ الْمَخْزَنِ وَالسَّفِينَةِ.', note: 'Barang berada di antara gudang dan kapal.', entity: 'cargo', vocab: ['cargo', 'warehouse', 'ship', 'bayna'], isEvidence: true },
  { id: 'c2-k6', ar: 'الضَّابِطُ قُرْبَ الرَّافِعَةِ.', note: 'Perwira berada dekat derek.', entity: 'officer', vocab: ['officer', 'crane', 'qurba'], isEvidence: true },
  { id: 'c2-k7', ar: 'الرُّبَّانُ فِي السَّفِينَةِ.', note: 'Nakhoda berada di dalam kapal.', entity: 'captain', vocab: ['captain', 'ship', 'fi'], isEvidence: true },
]

const mini: MapDef = { cols: 3, rows: 3, landmarks: [{ kind: 'lifeboat', col: 1, row: 1 }] }
const options: MiniMapOption[] = [
  { id: 'a', map: mini, placed: [{ kind: 'buoy', col: 1, row: 0 }] },
  { id: 'b', map: mini, placed: [{ kind: 'buoy', col: 1, row: 2 }] },
  { id: 'c', map: mini, placed: [{ kind: 'buoy', col: 0, row: 1 }] },
]

const choice: SceneChoiceTask = {
  id: 'c2-t1',
  type: 'scene-choice',
  titleId: 'Cocokkan gambar',
  instruction: 'Baca petunjuk, lalu pilih gambar peta yang sesuai.',
  promptAr: 'الْعَوَّامَةُ بِجَانِبِ قَارِبِ النَّجَاةِ.',
  focusText: 'الْعَوَّامَةُ بِجَانِبِ قَارِبِ النَّجَاةِ.',
  vocab: ['bijanib', 'buoy', 'lifeboat'],
  clueId: 'c2-k1',
  collects: ['c2-k1'],
  options,
  correct: 'c',
  wrongNotes: {
    a: 'Di gambar ini pelampung berada di belakang sekoci. Itu **خَلْفَ**, bukan **بِجَانِبِ**.',
    b: 'Di gambar ini pelampung berada di depan sekoci. Itu **أَمَامَ**, bukan **بِجَانِبِ**.',
  },
  hints: [
    'Cari kata yang menjelaskan posisi **الْعَوَّامَةُ** terhadap **قَارِبِ النَّجَاةِ**.',
    'Perhatikan kata **بِجَانِبِ** di tengah kalimat. Itu kata penentu posisinya.',
    '**بِجَانِبِ** berarti "di samping". Bangunan menghadap ke bawah; cari gambar saat pelampung bersebelahan dengan sekoci pada baris yang sama.',
  ],
  success: 'Benar. Kata **بِجَانِبِ** menunjukkan pelampung berada di samping sekoci, sejajar pada baris yang sama.',
}

function placement(
  n: number, instruction: string, map: MapDef, movables: PlacementTask['movables'],
  constraints: PlacementTask['constraints'], hints: PlacementTask['hints'], success: string, vocab: string[],
  focus: string,
): PlacementTask {
  return {
    id: `c2-t${n}`, type: 'placement', titleId: `Penempatan ${n - 1}`, instruction, focusText: focus,
    vocab, map, movables, constraints, hints, success, collects: constraints.map((c) => c.clueId),
  }
}

const p1 = placement(
  2, 'Letakkan benda pada peta sesuai petunjuk. Seret benda ke kotak, atau ketuk benda lalu ketuk kotaknya.',
  { cols: 4, rows: 3, landmarks: [{ kind: 'warehouse', col: 1, row: 1 }, { kind: 'ship', col: 3, row: 0 }, { kind: 'crane', col: 0, row: 0 }] },
  ['container'],
  [{ clueId: 'c2-k2', subject: 'container', rel: 'amama', objects: ['warehouse'] }],
  [
    'Baca satu petunjuk. Tentukan dulu benda mana yang harus kamu letakkan, dan terhadap benda apa.',
    'Perhatikan kata **أَمَامَ** pada petunjuk. Itu menentukan arah dari gudang.',
    '**أَمَامَ** berarti "di depan". Gudang menghadap ke bawah, jadi "di depan" adalah kotak tepat di bawahnya.',
  ],
  'Benar. Petunjuk menunjukkan kontainer berada di depan gudang — kotak tepat di bawah gudang yang menghadap dermaga.',
  ['amama', 'container', 'warehouse'],
  'الْحَاوِيَةُ أَمَامَ الْمَخْزَنِ.',
)

const p2 = placement(
  3, 'Dua petunjuk, dua benda. Pastikan setiap benda memenuhi petunjuknya.',
  { cols: 5, rows: 4, landmarks: [{ kind: 'warehouse', col: 1, row: 1 }, { kind: 'crane', col: 3, row: 2 }, { kind: 'lifeboat', col: 0, row: 3 }] },
  ['container', 'buoy'],
  [
    { clueId: 'c2-k3', subject: 'container', rel: 'khalfa', objects: ['warehouse'] },
    { clueId: 'c2-k4', subject: 'buoy', rel: 'bijanib', objects: ['crane'] },
  ],
  [
    'Kerjakan satu petunjuk dulu. Temukan benda yang dibicarakan, lalu benda pembandingnya.',
    'Kalimat pertama memakai **خَلْفَ**, kalimat kedua memakai **بِجَانِبِ**. Dua kata ini memberi arah yang berbeda.',
    '**خَلْفَ** = "di belakang" (kotak di atas bangunan, karena bangunan menghadap ke bawah). **بِجَانِبِ** = "di samping" (kiri atau kanan, satu baris).',
  ],
  'Benar. **خَلْفَ** menaruh kontainer di belakang gudang, dan **بِجَانِبِ** menaruh pelampung bersebelahan dengan derek.',
  ['khalfa', 'bijanib', 'container', 'buoy', 'warehouse', 'crane'],
  'الْحَاوِيَةُ خَلْفَ الْمَخْزَنِ.',
)

const p3 = placement(
  4, 'Tiga petunjuk sekaligus. Satu kotak hanya boleh diisi satu benda.',
  { cols: 5, rows: 4, landmarks: [{ kind: 'warehouse', col: 0, row: 1 }, { kind: 'ship', col: 4, row: 1 }, { kind: 'crane', col: 2, row: 3 }] },
  ['cargo', 'officer', 'captain'],
  [
    { clueId: 'c2-k5', subject: 'cargo', rel: 'bayna', objects: ['warehouse', 'ship'] },
    { clueId: 'c2-k6', subject: 'officer', rel: 'qurba', objects: ['crane'] },
    { clueId: 'c2-k7', subject: 'captain', rel: 'fi', objects: ['ship'] },
  ],
  [
    'Tiga kalimat, tiga kata tempat yang berbeda. Selesaikan satu per satu dan baca kata tempatnya dengan teliti.',
    'Kata tempatnya: **بَيْنَ**, **قُرْبَ**, dan **فِي**. Satu di antaranya mengikat benda ke dua bangunan sekaligus.',
    '**بَيْنَ** = di antara dua benda (satu baris, di tengah). **قُرْبَ** = dekat. **فِي** = di dalam, yaitu kotak yang sama dengan bangunannya.',
  ],
  'Benar. **بَيْنَ**, **قُرْبَ**, dan **فِي** kini semuanya terpenuhi pada peta.',
  ['bayna', 'qurba', 'fi', 'cargo', 'officer', 'captain'],
  'الْبِضَاعَةُ بَيْنَ الْمَخْزَنِ وَالسَّفِينَةِ.',
)

export const case2: CaseDefinition = {
  id: 'case-2',
  number: 2,
  titleAr: 'أَيْنَ هُوَ؟',
  titleId: 'Where Is It?',
  description: 'Tentukan posisi benda dari kata depan tempat.',
  story:
    'Manifes sudah dipulihkan, tetapi posisi beberapa benda tidak cocok dengan catatan lapangan. Gunakan petunjuk tertulis untuk menemukan posisi yang sebenarnya pada peta dermaga.',
  difficulty: 2,
  learningLevel: 'Pemahaman (Comprehension)',
  mechanic: 'Penempatan pada peta (seret / ketuk) dan deduksi ruang',
  objectives: [
    'Memahami أَمَامَ، خَلْفَ، بِجَانِبِ، بَيْنَ، فِي، قُرْبَ',
    'Mengubah kalimat Arab menjadi posisi pada peta',
    'Memeriksa beberapa petunjuk sekaligus',
  ],
  vocabulary: ['amama', 'khalfa', 'bijanib', 'bayna', 'fi', 'qurba', 'container', 'buoy', 'warehouse'],
  showVocabMeaning: true,
  clues,
  tasks: [choice, p1, p2, p3],
  solution: {
    summary: 'Posisi benda di dermaga berhasil direkonstruksi dari kata depan tempat.',
    evidenceIds: clues.map((c) => c.id),
  },
}
