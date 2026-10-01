const sourceMetadata = {
  'fullmetal-alchemist-sacred-star-edward': {
    url: 'https://www.hagaren-movie.net/character/',
    sourceTitle: 'The Sacred Star of Milos - Character profiles',
    sourceType: 'official-anime-character-profile',
    animeTitle: 'Fullmetal Alchemist: The Sacred Star of Milos',
    releaseMilestone: 'Feature film (2011)',
  },
  'kaguya-sama-ultra-romantic-kaguya': {
    url: 'https://kaguya.love/3rd/character/',
    sourceTitle: 'Kaguya-sama: Love Is War - Ultra Romantic - Characters',
    sourceType: 'official-anime-character-profile',
    animeTitle: 'Kaguya-sama: Love Is War - Ultra Romantic',
    releaseMilestone: 'TV anime season 3 (2022)',
  },
  'gintama-takasugi': {
    url: 'https://www.tv-tokyo.co.jp/anime/gintama/chara/kihei/',
    sourceTitle: 'Gintama - Kiheitai official character profile',
    sourceType: 'official-anime-character-profile',
    animeTitle: 'Gintama anime franchise',
    releaseMilestone: 'Mainline character profile; original episode/cutoff date not listed',
  },
}

function assertion(sourceId, tagId, sourceTerm, interpretation) {
  return {
    sourceId,
    tagId,
    traitType: 'personality-behavior',
    sourceTerm,
    editorialInterpretation: interpretation,
    confidence: 'medium',
    reviewStatus: 'proposed',
    reviewer: null,
    reviewedAt: null,
    spoiler: false,
    ...sourceMetadata[sourceId],
  }
}

export const characterProfiles = [
  {
    id: 'edward-elric-fmab',
    name: 'Edward Elric',
    series: 'Fullmetal Alchemist: Brotherhood',
    releaseMilestone: 'Related feature film: The Sacred Star of Milos (2011); later franchise cutoff not verified',
    releaseSourceUrl: 'https://www.hagaren-movie.net/intro/',
    latestReleaseVerified: false,
    traitCutoffAligned: false,
    assertions: [
      assertion('fullmetal-alchemist-sacred-star-edward', 'acts-under-uncertainty', '猪突猛進型', 'Hồ sơ phim mô tả Edward có xu hướng xông thẳng vào hành động.'),
    ],
  },
  {
    id: 'kaguya-shinomiya-ultra-romantic',
    name: 'Kaguya Shinomiya',
    series: 'Kaguya-sama: Love Is War - Ultra Romantic',
    releaseMilestone: 'Otona e no Kaidan special (broadcast 2025-12-31; streaming 2026-01-01)',
    releaseSourceUrl: 'https://kaguya.love/onair/',
    latestReleaseVerified: true,
    traitCutoffAligned: false,
    assertions: [
      assertion('kaguya-sama-ultra-romantic-kaguya', 'plans-alternatives', '様々な手段を日々試みている', 'Cô thường thử nhiều cách để khiến Shirogane bày tỏ tình cảm.'),
      assertion('kaguya-sama-ultra-romantic-kaguya', 'pursues-goals-strategically', '白銀から“告らせる”べく', 'Cô chủ động theo đuổi mục tiêu bằng các kế hoạch khác nhau.'),
    ],
  },
  {
    id: 'shinsuke-takasugi-gintama',
    name: 'Shinsuke Takasugi',
    series: 'Gintama',
    releaseMilestone: 'Latest franchise anime found: 3-nen Z-gumi Ginpachi-sensei (broadcast ended 2025); trait cutoff not verified',
    releaseSourceUrl: 'https://www.tv-tokyo.co.jp/anime/ginpachi/',
    latestReleaseVerified: false,
    traitCutoffAligned: false,
    assertions: [
      assertion('gintama-takasugi', 'leads-group', '鬼兵隊を率いて', 'Anh đứng đầu nhóm Kiheitai.'),
      assertion('gintama-takasugi', 'plans-confrontational-action', 'テロを画策する', 'Hồ sơ mô tả anh lập kế hoạch hành động đối đầu.'),
    ],
  },
]