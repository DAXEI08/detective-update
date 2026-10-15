import type { AssignTask, CaseDefinition, Clue, DialogueTask, ReportTask } from '../../types'

const clues: Clue[] = [
  { id: 'c3-s1', ar: 'رَأَيْتُ الضَّابِطَ فِي الْمَخْزَنِ.', note: 'Aku melihat perwira di gudang.', speaker: 'captain', entity: 'officer', vocab: ['officer', 'warehouse', 'fi'], isEvidence: true },
  { id: 'c3-s2', ar: 'رَأَيْتُ الرُّبَّانَ أَمَامَ السَّفِينَةِ.', note: 'Aku melihat nakhoda di depan kapal.', speaker: 'officer', entity: 'captain', vocab: ['captain', 'ship', 'amama'], isEvidence: true },
  { id: 'c3-s3', ar: 'نَحْنُ فِي صَالَةِ الِانْتِظَارِ.', note: 'Kami berada di ruang tunggu.', speaker: 'passengers', entity: 'passengers', vocab: ['passengers', 'waitingHall', 'fi'], isEvidence: true },
  { id: 'c3-s4', ar: 'الرَّافِعَةُ بِجَانِبِ السَّفِينَةِ.', note: 'Derek berada di samping kapal.', speaker: 'officer', entity: 'crane', vocab: ['crane', 'ship', 'bijanib'], isEvidence: false },
  { id: 'c3-s5', ar: 'رَأَيْنَا الْحَاوِيَةَ أَمَامَ الْمَخْزَنِ.', note: 'Kami melihat kontainer di depan gudang.', speaker: 'passengers', entity: 'container', vocab: ['container', 'warehouse', 'amama'], isEvidence: false },
]

const dialogue: DialogueTask = {
  id: 'c3-t1',
  type: 'dialogue',
  titleId: 'Dengarkan para saksi',
  instruction: 'Baca keterangan para saksi. Tandai kalimat yang memberi tahu DI MANA seorang tokoh berada.',
  question: 'Pertanyaan penyelidikan: di mana para tokoh berada?',
  focusText: 'رَأَيْتُ الضَّابِطَ فِي الْمَخْزَنِ.',
  vocab: ['officer', 'captain', 'passengers', 'fi', 'amama'],
  statementIds: ['c3-s4', 'c3-s1', 'c3-s5', 'c3-s3', 'c3-s2'],
  relevant: ['c3-s1', 'c3-s2', 'c3-s3'],
  collects: ['c3-s1', 'c3-s2', 'c3-s3'],
  reasons: {
    'c3-s4': 'Kalimat tentang **الرَّافِعَةُ** (derek) menjelaskan posisi benda, bukan posisi seorang tokoh.',
    'c3-s5': 'Kalimat ini menyebut **الْحَاوِيَةَ** (benda). Pertanyaannya tentang posisi tokoh.',
    'c3-s1': 'Kalimat ini menyebut **الضَّابِطَ** dan tempatnya — penting untuk menentukan lokasi tokoh.',
    'c3-s2': 'Kalimat ini menyebut **الرُّبَّانَ** dan tempatnya — penting untuk menentukan lokasi tokoh.',
    'c3-s3': 'Para penumpang menyebut tempat mereka sendiri — penting.',
  },
  hints: [
    'Fokus pada pertanyaan: **di mana tokoh berada?** Cari kalimat yang menyebut orang sekaligus tempatnya.',
    'Kalimat yang berguna menyebut seorang tokoh (**الضَّابِطَ، الرُّبَّانَ، نَحْنُ**) lalu kata tempat. Kalimat tentang benda tidak berguna untuk pertanyaan ini.',
    '**رَأَيْتُ** berarti "aku melihat". Jadi **رَأَيْتُ الضَّابِطَ …** memberi tahu keberadaan seorang tokoh. **نَحْنُ** berarti "kami". Periksa tiap kalimat dengan pola ini.',
  ],
  success: 'Benar. Tiga kalimat itu menyebut tokoh beserta tempatnya; dua kalimat lain hanya tentang benda.',
}

const assign: AssignTask = {
  id: 'c3-t2',
  type: 'assign',
  titleId: 'Tempatkan tokoh',
  instruction: 'Seret setiap tokoh ke tempat yang disebut para saksi, atau ketuk tokoh lalu ketuk tempatnya.',
  focusText: 'رَأَيْتُ الرُّبَّانَ أَمَامَ السَّفِينَةِ.',
  vocab: ['captain', 'officer', 'passengers', 'ship', 'warehouse', 'waitingHall', 'amama', 'fi'],
  items: ['captain', 'officer', 'passengers'],
  zones: [
    { id: 'z-wh', ar: 'فِي الْمَخْزَنِ', entity: 'warehouse' },
    { id: 'z-hall', ar: 'فِي صَالَةِ الِانْتِظَارِ', entity: 'waitingHall' },
    { id: 'z-ship', ar: 'أَمَامَ السَّفِينَةِ', entity: 'ship' },
  ],
  solution: { captain: 'z-ship', officer: 'z-wh', passengers: 'z-hall' },
  referenceIds: ['c3-s1', 'c3-s2', 'c3-s3'],
  collects: [],
  reasons: {
    captain: 'Cari kalimat yang menyebut **الرُّبَّانَ**. Setelahnya ada kata tempat **أَمَامَ**.',
    officer: 'Cari kalimat yang menyebut **الضَّابِطَ**. Setelahnya ada kata tempat **فِي**.',
    passengers: 'Cari kalimat dengan **نَحْنُ** ("kami") — para penumpang berbicara tentang diri mereka.',
  },
  hints: [
    'Gunakan kalimat saksi di panel referensi. Cari nama tokoh pada tiap kalimat.',
    'Setiap tokoh muncul tepat sekali pada tiga kalimat penting. Tempatnya ada di akhir kalimat itu.',
    '**فِي الْمَخْزَنِ** = di dalam gudang. **أَمَامَ السَّفِينَةِ** = di depan kapal. **فِي صَالَةِ الِانْتِظَارِ** = di dalam ruang tunggu.',
  ],
  success: 'Benar. Setiap tokoh kini berada di tempat yang disebut para saksi.',
}

const report: ReportTask = {
  id: 'c3-t3',
  type: 'report',
  titleId: 'Kesimpulan sementara',
  instruction: 'Berdasarkan keterangan saksi, tentukan siapa yang berada di dalam gudang.',
  focusText: 'مَنْ فِي الْمَخْزَنِ؟',
  vocab: ['officer', 'warehouse', 'fi'],
  collects: [],
  fields: [
    {
      key: 'who', labelAr: 'مَنْ فِي الْمَخْزَنِ؟', labelId: 'Siapa yang berada di dalam gudang?', correct: 'officer',
      options: [
        { id: 'captain', ar: 'الرُّبَّانُ', entity: 'captain' },
        { id: 'officer', ar: 'الضَّابِطُ', entity: 'officer' },
        { id: 'passengers', ar: 'الرُّكَّابُ', entity: 'passengers' },
      ],
      wrongNote: {
        captain: 'Nakhoda terlihat **أَمَامَ السَّفِينَةِ**, bukan di gudang.',
        passengers: 'Para penumpang berkata **نَحْنُ فِي صَالَةِ الِانْتِظَارِ** — mereka di ruang tunggu.',
      },
    },
  ],
  hints: [
    'Lihat kembali catatan lokasi tiap tokoh dari kalimat para saksi.',
    'Kata **الْمَخْزَنِ** hanya muncul pada satu keterangan. Siapa yang disebut di sana?',
    '**رَأَيْتُ** = "aku melihat" dan **فِي** = "di dalam". Pola **رَأَيْتُ + tokoh + فِي + tempat** memberi tahu siapa berada di mana. Cocokkan tiap kalimat dengan pola itu, lalu bandingkan tokoh-tokohnya.',
  ],
  success: 'Benar. Hanya perwira (**الضَّابِطُ**) yang disebut berada di gudang.',
}

export const case3: CaseDefinition = {
  id: 'case-3',
  number: 3,
  titleAr: 'الشُّهُودُ',
  titleId: 'The Witnesses',
  description: 'Baca keterangan saksi dan tentukan lokasi para tokoh.',
  story:
    'Beberapa orang berada di sekitar dermaga ketika barang berpindah tempat. Setiap saksi memberi keterangan singkat dalam bahasa Arab, tetapi tidak semuanya berguna. Pilah keterangan yang penting, lalu tentukan di mana setiap tokoh berada.',
  difficulty: 3,
  learningLevel: 'Interpretasi (Interpretation)',
  mechanic: 'Kartu dialog saksi, penandaan relevansi, dan penempatan tokoh',
  objectives: [
    'Membaca pernyataan pendek berpola رَأَيْتُ + tokoh + tempat',
    'Memilah kalimat yang relevan dengan pertanyaan',
    'Menentukan lokasi tokoh dari keterangan saksi',
  ],
  vocabulary: ['officer', 'captain', 'passengers', 'warehouse', 'ship', 'waitingHall', 'fi', 'amama'],
  showVocabMeaning: true,
  clues,
  tasks: [dialogue, assign, report],
  solution: {
    summary: 'Perwira berada di gudang, nakhoda di depan kapal, penumpang di ruang tunggu.',
    evidenceIds: ['c3-s1', 'c3-s2', 'c3-s3'],
  },
}
