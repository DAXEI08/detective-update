export interface AchievementDef {
  id: string
  ar: string
  idn: string
  desc: string
  icon: 'eye' | 'book' | 'map' | 'trophy'
}
export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'sharp-eye', ar: 'عَيْنُ الصَّقْرِ', idn: 'Sharp Eye', desc: 'Temukan semua bukti dalam satu kasus, termasuk bukti tersembunyi.', icon: 'eye' },
  { id: 'skilled-reader', ar: 'قَارِئٌ مَاهِرٌ', idn: 'Skilled Reader', desc: 'Pecahkan satu kasus tanpa bantuan Dalil.', icon: 'book' },
  { id: 'location-expert', ar: 'خَبِيرُ الْمَكَانِ', idn: 'Location Expert', desc: 'Selesaikan kasus ruang (Case 02) dengan akurasi minimal 90%.', icon: 'map' },
  { id: 'golden-detective', ar: 'الْمُحَقِّقُ الذَّهَبِيُّ', idn: 'Golden Detective', desc: 'Raih tiga bintang di kelima kasus.', icon: 'trophy' },
]
export const getAchievement = (id: string) => ACHIEVEMENTS.find((a) => a.id === id)
