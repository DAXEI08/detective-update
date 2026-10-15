import { getVocab } from '../vocabulary'

/** Generic 3-level hint set for "find the object named in the Arabic command" missions. */
export function missionHints(vocabId: string, definiteGenitive: string): [string, string, string] {
  const v = getVocab(vocabId)
  const ar = v?.ar ?? ''
  const idn = v?.idn ?? ''
  const cue = v?.cue ?? ''
  return [
    'Baca perintah di atas pelan-pelan. Setelah kata **عَنْ / عَنِ** ada kata benda yang sedang dicari.',
    `Kata benda yang dicari: **${definiteGenitive}**. Cocokkan dengan benda di dermaga — perhatikan bentuknya, bukan hanya warnanya.`,
    `**${ar}** berarti "${idn}". ${cue} Temukan benda itu lalu ketuk sendiri.`,
  ]
}
