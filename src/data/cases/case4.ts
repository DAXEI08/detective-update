import type { BoardTask, CaseDefinition, Clue, EliminationTask } from '../../types'

const clues: Clue[] = [
  { id: 'c4-a', ar: 'الْبِضَاعَةُ لَيْسَتْ فِي السَّفِينَةِ.', note: 'Barang tidak ada di kapal.', entity: 'cargo', vocab: ['cargo', 'ship', 'fi'], isEvidence: true },
  { id: 'c4-b', ar: 'الْبِضَاعَةُ لَيْسَتْ فِي صَالَةِ الِانْتِظَارِ.', note: 'Barang tidak ada di ruang tunggu.', entity: 'cargo', vocab: ['cargo', 'waitingHall', 'fi'], isEvidence: true },
  { id: 'c4-c', ar: 'الْحَاوِيَةُ أَمَامَ الْمَخْزَنِ.', note: 'Kontainer berada di depan gudang.', entity: 'container', vocab: ['container', 'warehouse', 'amama'], isEvidence: true },
  { id: 'c4-d', ar: 'الضَّابِطُ فِي الْمَخْزَنِ.', note: 'Perwira berada di gudang.', entity: 'officer', vocab: ['officer', 'warehouse', 'fi'], isEvidence: true },
  { id: 'c4-e', ar: 'الْعَوَّامَةُ بِجَانِبِ قَارِبِ النَّجَاةِ.', note: 'Pelampung berada di samping sekoci.', entity: 'buoy', vocab: ['buoy', 'lifeboat', 'bijanib'], isEvidence: false },
  { id: 'c4-f', ar: 'الرُّكَّابُ فِي صَالَةِ الِانْتِظَارِ.', note: 'Para penumpang berada di ruang tunggu.', entity: 'passengers', vocab: ['passengers', 'waitingHall', 'fi'], isEvidence: false },
  { id: 'c4-g', ar: 'الرُّبَّانُ لَيْسَ فِي الْمَخْزَنِ.', note: 'Nakhoda tidak berada di gudang.', entity: 'captain', vocab: ['captain', 'warehouse', 'fi'], isEvidence: false },
]

const sort: BoardTask = {
  id: 'c4-t1',
  type: 'board',
  phase: 'sort',
  titleId: 'Pilah bukti',
  instruction: 'Pertanyaan: di mana barang (الْبِضَاعَةُ) sekarang? Letakkan kartu yang membantu di zona "Penting", sisanya ke "Singkirkan".',
  focusText: 'الْبِضَاعَةُ لَيْسَتْ فِي السَّفِينَةِ.',
  vocab: ['cargo', 'fi', 'amama'],
  cardIds: ['c4-e', 'c4-a', 'c4-g', 'c4-c', 'c4-f', 'c4-b', 'c4-d'],
  relevant: ['c4-a', 'c4-b', 'c4-c', 'c4-d'],
  collects: ['c4-a', 'c4-b', 'c4-c', 'c4-d'],
  reasons: {
    'c4-a': 'Kartu ini membicarakan **الْبِضَاعَةُ** dan menyangkal satu lokasi — penting.',
    'c4-b': 'Kartu ini membicarakan **الْبِضَاعَةُ** dan menyangkal satu lokasi — penting.',
    'c4-c': 'Kontainer di depan gudang mengarah ke gudang sebagai lokasi barang — penting.',
    'c4-d': 'Perwira berada di gudang, tempat barang ditangani — penting.',
    'c4-e': 'Kartu ini tentang pelampung dan sekoci. Tidak membantu menemukan **الْبِضَاعَةُ**.',
    'c4-f': 'Kartu ini tentang para penumpang. Pertanyaannya tentang lokasi barang, bukan penumpang.',
    'c4-g': 'Kartu ini tentang nakhoda. Pertanyaannya tentang lokasi barang, bukan nakhoda.',
  },
  hints: [
    'Pertanyaan utamanya hanya satu: **di mana barang?** Kartu yang tidak membantu menjawabnya perlu disingkirkan.',
    'Cari kartu yang menyebut **الْبِضَاعَةُ** atau benda dan orang yang berkaitan langsung dengan tempat penyimpanannya.',
    '**لَيْسَتْ** berarti "tidak ada / bukan" — kalimat dengan kata ini menyingkirkan satu lokasi. Kartu tentang **الرُّكَّابُ**, **الرُّبَّانُ**, dan **الْعَوَّامَةُ** tidak membahas barang.',
  ],
  success: 'Benar. Empat kartu penting kini tersimpan di papan; tiga kartu lain disingkirkan karena tidak menjawab pertanyaan.',
}

const connect: BoardTask = {
  id: 'c4-t2',
  type: 'board',
  phase: 'connect',
  titleId: 'Hubungkan petunjuk',
  instruction: 'Ketuk dua kartu untuk menghubungkannya jika keduanya saling menguatkan. Kamu juga boleh menyematkan bukti kunci.',
  focusText: 'الضَّابِطُ فِي الْمَخْزَنِ.',
  vocab: ['warehouse', 'cargo', 'officer'],
  cardIds: ['c4-a', 'c4-b', 'c4-c', 'c4-d'],
  relevant: ['c4-a', 'c4-b', 'c4-c', 'c4-d'],
  collects: [],
  reasons: {},
  validLinks: [['c4-a', 'c4-b'], ['c4-c', 'c4-d']],
  requiredLinks: [['c4-a', 'c4-b'], ['c4-c', 'c4-d']],
  hints: [
    'Cari dua pasang kartu yang punya kata atau pola yang sama.',
    'Satu pasang sama-sama memakai kata penyangkal **لَيْسَتْ**. Pasangan lain menyebut tempat yang sama.',
    'Pasangan pertama: dua kartu yang sama-sama menyingkirkan lokasi barang. Pasangan kedua: kartu yang menyebut **الْمَخْزَنِ**.',
  ],
  success: 'Benar. Pasangan petunjuk itu saling menguatkan: dua menyingkirkan lokasi, dua menunjuk gudang.',
}

const elim: EliminationTask = {
  id: 'c4-t3',
  type: 'elimination',
  titleId: 'Eliminasi lokasi',
  instruction: 'Pilih lokasi, lalu pilih bukti yang membuktikan barang TIDAK ada di sana. Sisakan satu lokasi.',
  question: 'Di mana barang (الْبِضَاعَةُ) sekarang?',
  focusText: 'الْبِضَاعَةُ لَيْسَتْ فِي صَالَةِ الِانْتِظَارِ.',
  vocab: ['cargo', 'ship', 'waitingHall', 'warehouse', 'fi'],
  candidates: [
    { id: 'ship', ar: 'السَّفِينَةُ', entity: 'ship' },
    { id: 'waitingHall', ar: 'صَالَةُ الِانْتِظَارِ', entity: 'waitingHall' },
    { id: 'warehouse', ar: 'الْمَخْزَنُ', entity: 'warehouse' },
  ],
  answer: 'warehouse',
  eliminatedBy: { ship: ['c4-a'], waitingHall: ['c4-b'] },
  evidenceIds: ['c4-a', 'c4-b', 'c4-c', 'c4-d'],
  wrongHint: 'Cari kalimat yang memakai **لَيْسَتْ** dan menyebut lokasi itu.',
  collects: [],
  hints: [
    'Lokasi yang bisa disingkirkan adalah lokasi yang dinyatakan "bukan" tempat barang.',
    'Cari kata **لَيْسَتْ** pada kartu bukti, lalu lihat lokasi yang disebut setelah **فِي**.',
    '**الْبِضَاعَةُ لَيْسَتْ فِي X** berarti barang tidak berada di X. Cocokkan X dengan lokasi yang ingin kamu singkirkan.',
  ],
  success: 'Benar. Kapal dan ruang tunggu tersingkir oleh bukti; lokasi yang tersisa adalah gudang.',
}

export const case4: CaseDefinition = {
  id: 'case-4',
  number: 4,
  titleAr: 'الْأَدِلَّةُ',
  titleId: 'The Evidence',
  description: 'Pilah, hubungkan, dan singkirkan bukti di Papan Bukti.',
  story:
    'Bukti menumpuk di papan investigasi, tetapi sebagian tidak ada hubungannya dengan kasus. Pilah kartu yang penting, hubungkan petunjuk yang saling menguatkan, lalu singkirkan lokasi yang mustahil untuk menemukan di mana barang berada.',
  difficulty: 4,
  learningLevel: 'Analisis (Analysis)',
  mechanic: 'Papan Bukti: seret, sematkan, hubungkan, dan eliminasi',
  objectives: [
    'Menghubungkan beberapa petunjuk Arab',
    'Memahami kalimat penyangkal لَيْسَ / لَيْسَتْ',
    'Mengeliminasi kemungkinan berdasarkan bukti',
  ],
  vocabulary: ['cargo', 'ship', 'waitingHall', 'warehouse', 'container', 'fi', 'amama'],
  showVocabMeaning: true,
  clues,
  tasks: [sort, connect, elim],
  solution: {
    summary: 'Barang berada di gudang: kapal dan ruang tunggu disingkirkan oleh bukti.',
    evidenceIds: ['c4-a', 'c4-b', 'c4-c', 'c4-d'],
  },
}
