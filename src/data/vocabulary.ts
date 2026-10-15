import type { PrepEntry, VocabEntry, VocabId } from '../types'

export const VOCAB: VocabEntry[] = [
  { id: 'ship', ar: 'سَفِينَةٌ', idn: 'kapal', cue: 'Kendaraan besar di atas air, punya lambung dan anjungan.' },
  { id: 'warehouse', ar: 'مَخْزَنٌ', idn: 'gudang', cue: 'Bangunan besar beratap tempat menyimpan barang.' },
  { id: 'crane', ar: 'رَافِعَةٌ', idn: 'derek / alat pengangkat', cue: 'Alat tinggi dengan lengan dan kait untuk mengangkat beban.' },
  { id: 'officer', ar: 'ضَابِطٌ', idn: 'perwira', cue: 'Petugas berseragam dengan topi gelap dan tanda pangkat di bahu.' },
  { id: 'passengers', ar: 'رُكَّابٌ', idn: 'para penumpang', cue: 'Sekelompok orang yang membawa koper.' },
  { id: 'captain', ar: 'رُبَّانٌ', idn: 'nakhoda kapal', cue: 'Pemimpin kapal bertopi putih.' },
  { id: 'waitingHall', ar: 'صَالَةُ الِانْتِظَارِ', idn: 'ruang tunggu', cue: 'Bangunan beratap dengan jendela besar dan bangku untuk menunggu.' },
  { id: 'cargo', ar: 'بِضَاعَةٌ', idn: 'barang / muatan', cue: 'Tumpukan peti kayu.' },
  { id: 'container', ar: 'حَاوِيَةٌ', idn: 'kontainer', cue: 'Kotak baja besar dengan rusuk bergelombang.' },
  { id: 'lifeboat', ar: 'قَارِبُ النَّجَاةِ', idn: 'sekoci', cue: 'Perahu penyelamat berwarna oranye.' },
  { id: 'buoy', ar: 'عَوَّامَةٌ', idn: 'pelampung', cue: 'Cincin pelampung merah-putih.' },
]

export const PREPS: PrepEntry[] = [
  { id: 'amama', ar: 'أَمَامَ', idn: 'di depan' },
  { id: 'khalfa', ar: 'خَلْفَ', idn: 'di belakang' },
  { id: 'bijanib', ar: 'بِجَانِبِ', idn: 'di samping' },
  { id: 'bayna', ar: 'بَيْنَ', idn: 'di antara' },
  { id: 'fi', ar: 'فِي', idn: 'di / di dalam' },
  { id: 'qurba', ar: 'قُرْبَ', idn: 'dekat' },
]

const vocabMap = new Map<string, VocabEntry>(VOCAB.map((v) => [v.id, v]))
const prepMap = new Map<string, PrepEntry>(PREPS.map((p) => [p.id, p]))

export const getVocab = (id: string) => vocabMap.get(id)
export const getPrep = (id: string) => prepMap.get(id)
export function labelOf(id: string): { ar: string; idn: string } | undefined {
  return vocabMap.get(id) ?? prepMap.get(id)
}
export const VOCAB_IDS: VocabId[] = VOCAB.map((v) => v.id)
/** Definite, nominative display name for each entity (used on labels). */
export const NAME_DEFINITE: Record<string, string> = {
  ship: 'السَّفِينَةُ', warehouse: 'الْمَخْزَنُ', crane: 'الرَّافِعَةُ', officer: 'الضَّابِطُ',
  passengers: 'الرُّكَّابُ', captain: 'الرُّبَّانُ', waitingHall: 'صَالَةُ الِانْتِظَارِ',
  cargo: 'الْبِضَاعَةُ', container: 'الْحَاوِيَةُ', lifeboat: 'قَارِبُ النَّجَاةِ', buoy: 'الْعَوَّامَةُ',
  clipboard: 'الْوَرَقَةُ',
}
