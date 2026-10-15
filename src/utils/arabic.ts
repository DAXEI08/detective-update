const DIACRITICS = /[\u064B-\u065F\u0670\u0640\u200c\u200d]/g
const PUNCT = /[.،؟!:؛,"“”()]/g

/** Normalise Arabic for lexicon lookup: strip harakat, unify alef/yaa variants, drop punctuation. */
export function stripArabic(s: string): string {
  return s
    .replace(DIACRITICS, '')
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(PUNCT, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function toArabicIndic(n: number | string): string {
  return String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)])
}

export const ARABIC_RUN = /([\u0600-\u06FF\u0750-\u077F]+(?:[\s\u200c]+[\u0600-\u06FF\u0750-\u077F]+)*)/g

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}
