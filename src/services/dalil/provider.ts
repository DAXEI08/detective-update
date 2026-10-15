import type { DalilAction, DalilContext, DalilReply } from './types'
import { describePattern, glossSentence, lookupWord } from '../../data/lexicon'
import { stripArabic } from '../../utils/arabic'

const bold = (s: string) => `**${s}**`

/** Words that appear in ≥2 collected clues → likely connection points. Deterministic evidence analysis. */
function sharedWords(evidence: { ar: string }[]): string[] {
  const count = new Map<string, { ar: string; n: number }>()
  evidence.forEach((e) => {
    const seen = new Set<string>()
    glossSentence(e.ar).forEach((g) => {
      if (!g.entry || g.entry.kind !== 'noun') return
      if (seen.has(g.entry.key)) return
      seen.add(g.entry.key)
      const cur = count.get(g.entry.key) ?? { ar: g.entry.ar, n: 0 }
      cur.n += 1
      count.set(g.entry.key, cur)
    })
  })
  return Array.from(count.values()).filter((x) => x.n >= 2).map((x) => x.ar)
}

function explainSentence(ctx: DalilContext): string {
  const text = ctx.focusText ?? ctx.promptAr
  if (!text) return 'Ketuk sebuah petunjuk atau kartu bukti dulu, lalu minta aku menjelaskan kalimatnya.'
  const parts = glossSentence(text)
    .filter((g) => g.entry)
    .map((g) => `• ${bold(g.surface)} = ${g.entry!.idn}`)
  const unknown = glossSentence(text).filter((g) => !g.entry).length
  return [
    `Kalimat: ${bold(text)}`,
    parts.join('\n'),
    describePattern(text),
    unknown > 0 ? 'Ada kata yang belum ada di catatanku — coba tebak dari konteks gambar.' : 'Sekarang susun sendiri artinya, lalu cocokkan dengan gambar atau bukti.',
  ].filter(Boolean).join('\n')
}

function explainWord(ctx: DalilContext): string {
  if (!ctx.word) return 'Pilih satu kata dari kalimat petunjuk, lalu aku jelaskan.'
  const e = lookupWord(ctx.word)
  if (!e) return `Aku belum punya catatan untuk ${bold(ctx.word)}. Lihat konteks kalimatnya dan cari kata yang sudah kamu kenal.`
  const extra =
    e.kind === 'prep' ? ' Kata ini menunjukkan hubungan tempat antara dua benda.'
      : e.kind === 'noun' ? ' Setelah kata depan tempat, kata benda biasanya berakhiran kasrah.' : ''
  return `${bold(e.ar)} berarti "${e.idn}".${extra}`
}

function whyWrong(ctx: DalilContext): string {
  if (!ctx.lastMistake) return 'Belum ada jawaban yang salah di soal ini. Coba dulu, aku siap membantu kalau macet.'
  const words = ctx.lastMistake.vocab
    .map((v) => lookupWord(v))
    .filter((x): x is NonNullable<typeof x> => Boolean(x))
  const gl = words.slice(0, 3).map((w) => `${bold(w.ar)} = ${w.idn}`).join('; ')
  return [`Tadi: ${ctx.lastMistake.message}`, gl ? `Kata yang perlu kamu cek: ${gl}.` : '', 'Baca ulang petunjuknya, lalu coba lagi dengan perubahan kecil.'].filter(Boolean).join('\n')
}

function analyze(ctx: DalilContext): string {
  const lines: string[] = [`Kamu punya ${ctx.evidenceFound} dari ${ctx.evidenceTotal} bukti di kasus ini.`]
  if (ctx.evidence.length === 0) return `${lines[0]} Mulai dengan mengumpulkan bukti dari tugas yang sedang berjalan.`
  const shared = sharedWords(ctx.evidence)
  if (shared.length) lines.push(`Kata ${shared.slice(0, 3).map(bold).join(', ')} muncul di lebih dari satu bukti — mungkin ada hubungan.`)
  const neg = ctx.evidence.filter((e) => /لي(س|ست)/.test(stripArabic(e.ar)))
  if (neg.length) lines.push(`${neg.length} bukti memakai kata penyangkal ${bold('لَيْسَ / لَيْسَتْ')}: bukti jenis ini menyingkirkan kemungkinan.`)
  lines.push('Bandingkan bukti yang menyebut tempat yang sama dan tanyakan: siapa atau apa yang berhubungan dengan tempat itu?')
  return lines.join('\n')
}

function hint(ctx: DalilContext): string {
  const base = ctx.authoredHints[ctx.hintLevel - 1]
  const prefix = ctx.hintRepeat
    ? 'Ini petunjuk terakhir yang tersedia. '
    : ctx.failedAttempts >= 3 ? 'Tenang, kita pelan-pelan. ' : ctx.failedAttempts >= 1 ? 'Sudah dekat. ' : ''
  const tail = ctx.hintLevel === 3 ? ' (Petunjuk 3/3 — terakhir)' : ` (Petunjuk ${ctx.hintLevel}/3)`
  return `${prefix}${base}${tail}`
}

/** Pure, synchronous, deterministic. */
export function respond(action: DalilAction, ctx: DalilContext): DalilReply {
  switch (action) {
    case 'hint': return { text: hint(ctx), level: ctx.hintLevel }
    case 'explainSentence': return { text: explainSentence(ctx) }
    case 'explainWord': return { text: explainWord(ctx) }
    case 'whyWrong': return { text: whyWrong(ctx) }
    case 'analyzeEvidence': return { text: analyze(ctx) }
  }
}
