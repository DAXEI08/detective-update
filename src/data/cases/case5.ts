import type { CaseDefinition, Clue, DialogueTask, EliminationTask, InspectTask, ReportTask, SequenceTask } from '../../types'

const clues: Clue[] = [
  { id: 'c5-container', ar: 'الْحَاوِيَةُ أَمَامَ السَّفِينَةِ.', note: 'Kontainer berada di depan kapal.', entity: 'container', vocab: ['container', 'ship', 'amama'], isEvidence: true },
  { id: 'c5-warehouse', ar: 'الْبِضَاعَةُ فِي الْمَخْزَنِ.', note: 'Barang berada di gudang.', entity: 'warehouse', vocab: ['cargo', 'warehouse', 'fi'], isEvidence: true },
  { id: 'c5-officer', ar: 'الضَّابِطُ فِي الْمَخْزَنِ.', note: 'Perwira berada di gudang.', entity: 'officer', vocab: ['officer', 'warehouse', 'fi'], isEvidence: true },
  { id: 'c5-captain', ar: 'الرُّبَّانُ لَيْسَ فِي الْمَخْزَنِ.', note: 'Nakhoda tidak berada di gudang.', entity: 'captain', vocab: ['captain', 'warehouse', 'fi'], isEvidence: true },
  { id: 'c5-hall', ar: 'الرُّكَّابُ فِي صَالَةِ الِانْتِظَارِ.', note: 'Para penumpang berada di ruang tunggu.', entity: 'waitingHall', vocab: ['passengers', 'waitingHall', 'fi'], isEvidence: true },
  { id: 'c5-lifeboat', ar: 'قَارِبُ النَّجَاةِ قُرْبَ الْعَوَّامَةِ.', note: 'Sekoci berada dekat pelampung.', entity: 'lifeboat', vocab: ['lifeboat', 'buoy', 'qurba'], isEvidence: false },
  { id: 'c5-crane', ar: 'الرَّافِعَةُ بِجَانِبِ السَّفِينَةِ.', note: 'Derek berada di samping kapal.', entity: 'crane', vocab: ['crane', 'ship', 'bijanib'], isEvidence: false },
  { id: 'c5-w1', ar: 'رَأَيْنَا الضَّابِطَ بِجَانِبِ الْحَاوِيَةِ.', note: 'Kami melihat perwira di samping kontainer.', speaker: 'passengers', entity: 'officer', vocab: ['officer', 'container', 'bijanib'], isEvidence: true },
  { id: 'c5-w2', ar: 'أَنَا أَمَامَ السَّفِينَةِ.', note: 'Aku berada di depan kapal.', speaker: 'captain', entity: 'captain', vocab: ['captain', 'ship', 'amama'], isEvidence: true },
  { id: 'c5-w3', ar: 'الْعَوَّامَةُ بِجَانِبِ قَارِبِ النَّجَاةِ.', note: 'Pelampung berada di samping sekoci.', speaker: 'officer', entity: 'buoy', vocab: ['buoy', 'lifeboat', 'bijanib'], isEvidence: false },
  { id: 'c5-e1', ar: 'الْحَاوِيَةُ أَمَامَ السَّفِينَةِ.', note: 'Kontainer berada di depan kapal.', vocab: ['container', 'ship', 'amama'], isEvidence: false },
  { id: 'c5-e2', ar: 'الضَّابِطُ بِجَانِبِ الْحَاوِيَةِ.', note: 'Perwira berada di samping kontainer.', vocab: ['officer', 'container', 'bijanib'], isEvidence: false },
  { id: 'c5-e3', ar: 'الضَّابِطُ فِي الْمَخْزَنِ.', note: 'Perwira berada di gudang.', vocab: ['officer', 'warehouse', 'fi'], isEvidence: false },
  { id: 'c5-e4', ar: 'الْبِضَاعَةُ فِي الْمَخْزَنِ.', note: 'Barang berada di gudang.', vocab: ['cargo', 'warehouse', 'fi'], isEvidence: false },
]

const inspect: InspectTask = {
  id: 'c5-t1',
  type: 'inspect',
  titleId: 'Periksa lokasi',
  instruction: 'Ketuk benda di dermaga untuk membaca petunjuknya. Simpan yang membantu menjawab: siapa yang memindahkan barang ke gudang?',
  focusText: 'الضَّابِطُ فِي الْمَخْزَنِ.',
  vocab: ['officer', 'cargo', 'warehouse', 'fi', 'amama'],
  entities: [
    { entity: 'container', clueId: 'c5-container', relevant: true },
    { entity: 'warehouse', clueId: 'c5-warehouse', relevant: true },
    { entity: 'officer', clueId: 'c5-officer', relevant: true },
    { entity: 'captain', clueId: 'c5-captain', relevant: true },
    { entity: 'waitingHall', clueId: 'c5-hall', relevant: true },
    { entity: 'lifeboat', clueId: 'c5-lifeboat', relevant: false, why: 'Kalimat ini tentang sekoci dan pelampung — tidak membantu menentukan siapa yang memindahkan barang.' },
    { entity: 'crane', clueId: 'c5-crane', relevant: false, why: 'Kalimat ini hanya tentang posisi derek terhadap kapal — tidak menyangkut barang atau tokoh.' },
    { entity: 'ship' },
    { entity: 'cargo' },
    { entity: 'buoy' },
    { entity: 'passengers' },
  ],
  collects: [],
  hints: [
    'Ketuk benda satu per satu. Tanyakan pada tiap kalimat: apakah ini menunjukkan siapa yang ada di dekat barang atau siapa yang bukan?',
    'Kalimat penting menyebut barang, gudang, atau lokasi tokoh. Kalimat tentang **قَارِبُ النَّجَاةِ** atau **الرَّافِعَةُ** tidak menyangkut tokoh.',
    '**لَيْسَ فِي الْمَخْزَنِ** = "tidak ada di gudang" — petunjuk ini menyingkirkan seorang tokoh. **فِي الْمَخْزَنِ** tanpa **لَيْسَ** = berada di gudang.',
  ],
  success: 'Benar. Lima petunjuk penting tersimpan; dua kalimat pengecoh tidak kamu simpan.',
}

const dialogue: DialogueTask = {
  id: 'c5-t2',
  type: 'dialogue',
  titleId: 'Keterangan terakhir',
  instruction: 'Tiga saksi memberi keterangan tambahan. Tandai yang membantu menentukan siapa yang berada di dekat kontainer atau di depan kapal.',
  question: 'Pertanyaan: siapa yang memindahkan barang?',
  focusText: 'رَأَيْنَا الضَّابِطَ بِجَانِبِ الْحَاوِيَةِ.',
  vocab: ['officer', 'container', 'captain', 'bijanib', 'amama'],
  statementIds: ['c5-w3', 'c5-w1', 'c5-w2'],
  relevant: ['c5-w1', 'c5-w2'],
  collects: ['c5-w1', 'c5-w2'],
  reasons: {
    'c5-w1': 'Penumpang melihat **الضَّابِطَ** di samping kontainer — petunjuk langsung tentang perwira.',
    'c5-w2': 'Nakhoda menyebut posisinya sendiri: di depan kapal. Itu menyingkirkan dia dari gudang.',
    'c5-w3': 'Kalimat ini hanya tentang pelampung dan sekoci — tidak membantu.',
  },
  hints: [
    'Cari kalimat yang menyebut tokoh dan tempatnya. Kalimat tentang benda saja bukan petunjuk untuk pertanyaan ini.',
    'Kalimat penting menyebut **الضَّابِطَ** atau menyebut posisi sang pembicara (**أَنَا**).',
    '**رَأَيْنَا** = "kami melihat". **أَنَا أَمَامَ السَّفِينَةِ** = "aku di depan kapal". Keduanya menyebut tokoh; kalimat pelampung tidak.',
  ],
  success: 'Benar. Dua keterangan itu menyebut tokoh dan lokasinya; kalimat pelampung diabaikan.',
}

const sequence: SequenceTask = {
  id: 'c5-t3',
  type: 'sequence',
  titleId: 'Susun kronologi',
  instruction: 'Urutkan kejadian dari awal sampai akhir. Barang berpindah dari kontainer ke gudang.',
  focusText: 'الْحَاوِيَةُ أَمَامَ السَّفِينَةِ.',
  vocab: ['container', 'officer', 'warehouse', 'cargo', 'amama', 'fi', 'bijanib'],
  eventIds: ['c5-e4', 'c5-e2', 'c5-e1', 'c5-e3'],
  order: ['c5-e1', 'c5-e2', 'c5-e3', 'c5-e4'],
  note: 'Catatan petugas: barang bermula di dalam kontainer yang diturunkan di depan kapal, dan berakhir tersimpan di gudang.',
  collects: [],
  hints: [
    'Mulailah dari kondisi awal, yaitu tempat barang diturunkan dari kapal. Akhiri dengan kondisi barang saat ini.',
    'Pikirkan dua hal: apa yang terjadi lebih dulu antara kontainer dan perwira, dan keadaan barang apa yang menjadi hasil akhir.',
    '**أَمَامَ السَّفِينَةِ** (di depan kapal) adalah titik awal. **فِي الْمَخْزَنِ** (di gudang) muncul dua kali: perwira lebih dulu, barang kemudian.',
  ],
  success: 'Benar. Alurnya: kontainer di depan kapal, perwira mendekat, perwira masuk gudang, barang tersimpan di gudang.',
}

const elim: EliminationTask = {
  id: 'c5-t4',
  type: 'elimination',
  titleId: 'Eliminasi tersangka',
  instruction: 'Pilih seorang tokoh, lalu pilih bukti yang membuktikan dia bukan yang memindahkan barang ke gudang.',
  question: 'Siapa yang memindahkan barang ke gudang?',
  focusText: 'الرُّبَّانُ لَيْسَ فِي الْمَخْزَنِ.',
  vocab: ['captain', 'passengers', 'officer', 'warehouse', 'waitingHall', 'fi'],
  candidates: [
    { id: 'captain', ar: 'الرُّبَّانُ', entity: 'captain' },
    { id: 'passengers', ar: 'الرُّكَّابُ', entity: 'passengers' },
    { id: 'officer', ar: 'الضَّابِطُ', entity: 'officer' },
  ],
  answer: 'officer',
  eliminatedBy: { captain: ['c5-captain', 'c5-w2'], passengers: ['c5-hall'] },
  evidenceIds: ['c5-container', 'c5-warehouse', 'c5-officer', 'c5-captain', 'c5-hall', 'c5-w1', 'c5-w2'],
  wrongHint: 'Cari bukti yang menyebut tokoh itu berada di tempat lain, bukan di gudang.',
  collects: [],
  hints: [
    'Singkirkan tokoh yang terbukti berada di tempat lain saat barang dipindahkan.',
    'Satu tokoh punya kalimat **لَيْسَ فِي الْمَخْزَنِ** atau lokasi lain di depan kapal; tokoh lain punya kalimat tentang **صَالَةِ الِانْتِظَارِ**.',
    '**أَمَامَ** = "di depan", **فِي** = "di dalam". Bandingkan tempat tiap tokoh dengan tempat barang dipindahkan; tokoh yang tidak punya bukti berada di tempat lain belum bisa disingkirkan.',
  ],
  success: 'Benar. Nakhoda dan penumpang terbukti berada di tempat lain; satu tokoh tersisa.',
}

const report: ReportTask = {
  id: 'c5-t5',
  type: 'report',
  titleId: 'Kesimpulan akhir',
  instruction: 'Susun laporan akhir: siapa, apa, di mana — lalu pilih bukti yang mendukung kesimpulanmu.',
  focusText: 'مَنِ الْمَسْؤُولُ؟',
  vocab: ['officer', 'cargo', 'warehouse', 'fi'],
  collects: [],
  fields: [
    {
      key: 'who', labelAr: 'مَنْ؟', labelId: 'Siapa yang memindahkan barang?', correct: 'officer',
      options: [
        { id: 'captain', ar: 'الرُّبَّانُ', entity: 'captain' },
        { id: 'officer', ar: 'الضَّابِطُ', entity: 'officer' },
        { id: 'passengers', ar: 'الرُّكَّابُ', entity: 'passengers' },
      ],
      wrongNote: {
        captain: 'Nakhoda **لَيْسَ فِي الْمَخْزَنِ** dan berada **أَمَامَ السَّفِينَةِ**.',
        passengers: 'Para penumpang berada **فِي صَالَةِ الِانْتِظَارِ**.',
      },
    },
    {
      key: 'what', labelAr: 'مَاذَا؟', labelId: 'Apa yang dipindahkan?', correct: 'cargo',
      options: [
        { id: 'container', ar: 'الْحَاوِيَةُ', entity: 'container' },
        { id: 'cargo', ar: 'الْبِضَاعَةُ', entity: 'cargo' },
        { id: 'buoy', ar: 'الْعَوَّامَةُ', entity: 'buoy' },
      ],
      wrongNote: {
        container: 'Kontainer tetap **أَمَامَ السَّفِينَةِ**; yang berpindah adalah isinya.',
        buoy: 'Tidak ada petunjuk yang menyebut pelampung berpindah.',
      },
    },
    {
      key: 'where', labelAr: 'أَيْنَ؟', labelId: 'Di mana barang sekarang?', correct: 'warehouse',
      options: [
        { id: 'ship', ar: 'السَّفِينَةُ', entity: 'ship' },
        { id: 'warehouse', ar: 'الْمَخْزَنُ', entity: 'warehouse' },
        { id: 'waitingHall', ar: 'صَالَةُ الِانْتِظَارِ', entity: 'waitingHall' },
      ],
      wrongNote: {
        ship: 'Tidak ada bukti barang berada di kapal; **الْبِضَاعَةُ فِي الْمَخْزَنِ**.',
        waitingHall: 'Ruang tunggu dipakai para penumpang, bukan tempat barang.',
      },
    },
  ],
  evidencePicker: {
    validIds: ['c5-warehouse', 'c5-officer', 'c5-w1'],
    min: 2,
    invalidNote: 'Pilih hanya bukti yang langsung mendukung kesimpulan, yaitu yang menyebut barang, gudang, atau perwira.',
  },
  hints: [
    'Gunakan semua bukti yang sudah kamu kumpulkan. Tiap kolom laporan punya satu jawaban yang konsisten dengan bukti.',
    'Bukti yang mendukung menyebut tokoh, barang, atau tempat tujuan **tanpa** penyangkal. Bukti dengan **لَيْسَ** atau tempat lain menyingkirkan orang lain.',
    'Cocokkan tiap kolom laporan dengan kalimat bukti yang menyebut tempat tujuan. Bukti yang kamu pilih harus saling menguatkan, bukan menyebut tempat lain.',
  ],
  success: 'Kasus terpecahkan. Laporan akhirmu konsisten dengan seluruh bukti.',
}

export const case5: CaseDefinition = {
  id: 'case-5',
  number: 5,
  titleAr: 'مَنِ الْمَسْؤُولُ؟',
  titleId: 'Final Investigation',
  description: 'Gabungkan semua teknik untuk memecahkan kasus penutup.',
  story:
    'Barang yang hilang akhirnya ditemukan, tetapi siapa yang memindahkannya dan mengapa? Periksa dermaga, dengarkan kesaksian terakhir, susun kronologi, singkirkan yang mustahil, lalu tulis laporan akhirmu.',
  difficulty: 5,
  learningLevel: 'Pemecahan masalah (Problem Solving)',
  mechanic: 'Eksplorasi lokasi, saksi, kronologi, eliminasi, dan kesimpulan akhir',
  objectives: [
    'Memadukan petunjuk lokasi, saksi, dan bukti',
    'Menyusun kronologi dari kalimat Arab',
    'Menarik kesimpulan akhir dan mendukungnya dengan bukti',
  ],
  vocabulary: ['officer', 'cargo', 'warehouse', 'container', 'captain', 'passengers', 'fi', 'amama', 'bijanib'],
  showVocabMeaning: true,
  clues,
  tasks: [inspect, dialogue, sequence, elim, report],
  solution: {
    summary: 'Perwira memindahkan barang dari kontainer ke gudang.',
    evidenceIds: ['c5-warehouse', 'c5-officer', 'c5-w1'],
  },
  reveal: {
    lines: [
      { ar: 'الْحَاوِيَةُ أَمَامَ السَّفِينَةِ.', id: 'Barang mulai dari kontainer di depan kapal.' },
      { ar: 'الضَّابِطُ بِجَانِبِ الْحَاوِيَةِ.', id: 'Perwira mendekati kontainer.' },
      { ar: 'الضَّابِطُ فِي الْمَخْزَنِ.', id: 'Perwira pindah ke gudang.' },
      { ar: 'الْبِضَاعَةُ فِي الْمَخْزَنِ.', id: 'Barang kini tersimpan di gudang.' },
    ],
    conclusion:
      'Tidak ada kejahatan: sang perwira memindahkan barang ke gudang agar aman dari cuaca, tetapi lupa mencatatnya. Barang selamat, dan kamu memecahkannya dengan membaca bahasa Arab.',
  },
}
