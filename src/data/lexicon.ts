import { stripArabic } from '../utils/arabic'
import { PREPS, VOCAB } from './vocabulary'

export type LexKind = 'noun' | 'prep' | 'verb' | 'pron' | 'particle'
export interface LexEntry { key: string; ar: string; idn: string; kind: LexKind; refId?: string }
export interface GlossItem { surface: string; entry: LexEntry | null; conj?: boolean }

const index = new Map<string, LexEntry>()

function add(ar: string, idn: string, kind: LexKind, refId?: string, extraForms: string[] = []) {
  const key = stripArabic(ar)
  const entry: LexEntry = { key, ar, idn, kind, refId }
  const forms = new Set<string>([key, ...extraForms.map(stripArabic)])
  if (kind === 'noun' && !key.startsWith('ال')) forms.add('ال' + key)
  forms.forEach((f) => { if (!index.has(f)) index.set(f, entry) })
}

VOCAB.forEach((v) => add(v.ar, v.idn, 'noun', v.id))
PREPS.forEach((p) => add(p.ar, p.idn, 'prep', p.id))

add('رَأَيْتُ', 'aku melihat', 'verb')
add('رَأَيْنَا', 'kami melihat', 'verb')
add('أَنَا', 'aku / saya', 'pron')
add('نَحْنُ', 'kami', 'pron')
add('لَيْسَ', 'bukan / tidak ada (untuk laki-laki / benda maskulin)', 'particle')
add('لَيْسَتْ', 'bukan / tidak ada (untuk benda feminin)', 'particle')
add('هَذَا', 'ini (maskulin)', 'pron')
add('هَذِهِ', 'ini (feminin)', 'pron')
add('اِبْحَثْ', 'carilah', 'verb')
add('عَنْ', 'tentang / untuk', 'particle')
add('الْمِينَاءُ', 'pelabuhan', 'noun')
add('أَيْنَ', 'di mana', 'particle')
add('مَنْ', 'siapa', 'particle')
add('وَ', 'dan', 'particle')
add('الْمَسْؤُولُ', 'yang bertanggung jawab', 'noun')

/** Greedy word-by-word gloss. Two-word idafa phrases (قَارِبُ النَّجَاةِ, صَالَةُ الِانْتِظَارِ) are matched first. */
export function glossSentence(ar: string): GlossItem[] {
  const tokens = ar.split(/\s+/).filter(Boolean)
  const out: GlossItem[] = []
  for (let i = 0; i < tokens.length; ) {
    if (i + 1 < tokens.length) {
      const phrase = stripArabic(`${tokens[i]} ${tokens[i + 1]}`)
      const hit = index.get(phrase)
      if (hit) { out.push({ surface: `${tokens[i]} ${tokens[i + 1]}`, entry: hit }); i += 2; continue }
    }
    const key = stripArabic(tokens[i])
    let entry = index.get(key) ?? null
    let conj = false
    if (!entry && key.length > 2 && key.startsWith('و')) {
      const rest = index.get(key.slice(1))
      if (rest) { entry = rest; conj = true }
    }
    out.push({ surface: tokens[i], entry, conj })
    i++
  }
  return out
}

export function lookupWord(surface: string): LexEntry | null {
  return glossSentence(surface)[0]?.entry ?? null
}

/** Short structural note about a sentence, derived from the prepositions it contains. */
export function describePattern(ar: string): string {
  const g = glossSentence(ar)
  const preps = g.filter((x) => x.entry?.kind === 'prep').map((x) => x.entry!.ar)
  const neg = g.some((x) => x.entry?.kind === 'particle' && /^لي/.test(x.entry.key))
  if (preps.length === 0) return 'Kalimat ini tidak memuat kata depan tempat.'
  const base = `Pola: **[benda / orang]** + **${preps.join(' / ')}** + **[tempat]**.`
  return neg ? `${base} Ada kata penyangkal (**لَيْسَ / لَيْسَتْ**) — artinya kalimat menyangkal posisi itu.` : base
}
