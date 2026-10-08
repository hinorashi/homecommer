// Heuristic traits derived from AniList character descriptions. AniList has no structured
// personality data, so we match a curated English keyword lexicon against the non-spoiler part
// of each bio and keep the sentence that triggered the match as evidence.

export const TRAIT_GROUPS = [
  { id: 'personality', label: 'Tính cách' },
  { id: 'archetype', label: 'Hình mẫu' },
  { id: 'occupation', label: 'Vai trò / nghề nghiệp' },
  { id: 'species', label: 'Chủng loài / năng lực' },
]

const trait = (id, group, label, patterns) => ({ id, group, label, patterns })

export const TRAIT_LEXICON = [
  trait('cheerful', 'personality', 'Vui vẻ, năng động', [/\bcheerful\b/, /\benergetic\b/, /\bbubbly\b/, /\boptimistic\b/, /\bupbeat\b/]),
  trait('shy', 'personality', 'Nhút nhát', [/\bshy\b/, /\btimid\b/, /\bintroverted\b/, /\bsoft-spoken\b/]),
  trait('stoic', 'personality', 'Lạnh lùng, ít cảm xúc', [/\bstoic\b/, /\baloof\b/, /\bemotionless\b/, /\bexpressionless\b/, /\bcold-hearted\b/, /\bcold and\b/, /\bcold personality\b/, /\bindifferent\b/]),
  trait('kind', 'personality', 'Tốt bụng, ân cần', [/\bkind-hearted\b/, /\bkindhearted\b/, /\bgood-natured\b/, /\bcompassionate\b/, /\bcaring (?:person|and|nature|personality|girl|boy)\b/, /\bvery caring\b/, /\bgentle personality\b/, /\bvery kind\b/, /\bkind and\b/]),
  trait('serious', 'personality', 'Nghiêm túc', [/\bserious and\b/, /\bvery serious\b/, /\bserious personality\b/, /\bstern\b/, /\bstrict\b/, /\bdisciplined\b/]),
  trait('calm', 'personality', 'Điềm tĩnh', [/\bcalm and collected\b/, /\blevel-headed\b/, /\bcomposed\b/, /\bcalm demeanor\b/, /\bcalm personality\b/]),
  trait('hot-headed', 'personality', 'Nóng tính', [/\bhot-headed\b/, /\bhotheaded\b/, /\bhot-tempered\b/, /\bshort-tempered\b/, /\bshort temper\b/, /\bquick to anger\b/, /\bhot temper\b/]),
  trait('arrogant', 'personality', 'Kiêu ngạo', [/\barrogant\b/, /\bhaughty\b/, /\bconceited\b/, /\bcocky\b/, /\bprideful\b/, /\bnarcissistic\b/]),
  trait('lazy', 'personality', 'Lười biếng', [/\blazy\b/, /\bslacker\b/, /\bapathetic\b/]),
  trait('clumsy', 'personality', 'Hậu đậu, ngơ ngác', [/\bclumsy\b/, /\bairhead(?:ed)?\b/, /\bscatterbrained\b/, /\bditzy\b/]),
  trait('mischievous', 'personality', 'Tinh nghịch', [/\bmischievous\b/, /\bprankster\b/, /\btroublemaker\b/, /\bplayful\b/]),
  trait('brave', 'personality', 'Dũng cảm', [/\bbrave\b/, /\bcourageous\b/, /\bfearless\b/, /\bheroic\b/]),
  trait('loyal', 'personality', 'Trung thành', [/\bloyal\b/, /\bloyalty\b/, /\bdevoted\b/]),
  trait('intelligent', 'personality', 'Thông minh', [/\bgenius\b/, /\bprodigy\b/, /\bhighly intelligent\b/, /\bextremely intelligent\b/, /\bvery intelligent\b/, /\bbrilliant\b/, /\bintellect\b/]),
  trait('cunning', 'personality', 'Mưu mô, xảo quyệt', [/\bcunning\b/, /\bmanipulative\b/, /\bscheming\b/, /\bdeceitful\b/, /\bstrategist\b/, /\bmastermind\b/]),
  trait('sadistic', 'personality', 'Tàn nhẫn, bạo dâm', [/\bsadistic\b/, /\bsadist\b/, /\bruthless\b/, /\bmerciless\b/, /\bcruel\b/]),
  trait('pervert', 'personality', 'Biến thái', [/\bperverted\b/, /\bpervert\b/, /\blecherous\b/]),
  trait('loner', 'personality', 'Thích một mình', [/\bloner\b/, /\bantisocial\b/, /\banti-social\b/, /\bsocially awkward\b/]),
  trait('gluttonous', 'personality', 'Ham ăn', [/\bglutton(?:ous)?\b/, /\bbig eater\b/, /\blarge appetite\b/, /\benormous appetite\b/, /\bhuge appetite\b/]),
  trait('tsundere', 'archetype', 'Tsundere', [/\btsundere\b/]),
  trait('yandere', 'archetype', 'Yandere', [/\byandere\b/]),
  trait('kuudere', 'archetype', 'Kuudere', [/\bkuudere\b/]),
  trait('dandere', 'archetype', 'Dandere', [/\bdandere\b/]),
  trait('chuunibyou', 'archetype', 'Chuunibyou', [/\bchuunibyou\b/, /\bchuuni\b/, /\beighth-grader syndrome\b/]),
  trait('otaku', 'archetype', 'Otaku / hikikomori', [/\botaku\b/, /\bhikikomori\b/, /\bshut-in\b/, /\bneet\b/]),
  trait('gyaru', 'archetype', 'Gyaru', [/\bgyaru\b/, /\bgal\b(?= style| fashion)/]),
  trait('delinquent', 'archetype', 'Côn đồ / yankee', [/\bdelinquent\b/, /\byankee\b/, /\bbanchou\b/, /\bthug\b/, /\bgangster\b/]),
  trait('childhood-friend', 'archetype', 'Bạn thanh mai trúc mã', [/\bchildhood friends?\b/]),
  trait('rival', 'archetype', 'Đối thủ', [/\brival\b/, /\brivals\b/, /\brivalry\b/]),
  trait('villain', 'archetype', 'Phản diện', [/\bvillain\b/, /\bantagonist\b/, /\bmain enemy\b/]),
  trait('reincarnated', 'archetype', 'Chuyển sinh / isekai', [/\breincarnat(?:ed|ion)\b/, /\btransported to (?:another|a different|a fantasy) world\b/, /\bsummoned (?:to|into) (?:another|a different|this) world\b/]),
  trait('twin', 'archetype', 'Sinh đôi', [/\btwin (?:sister|brother)\b/, /\bidentical twin\b/, /\bis a twin\b/, /\btwins\b/]),
  trait('student-council', 'occupation', 'Hội học sinh', [/\bstudent council\b/]),
  trait('teacher', 'occupation', 'Giáo viên', [/\bteacher\b/, /\bhomeroom\b/, /\bsensei\b/, /\bprofessor\b/, /\binstructor\b/]),
  trait('idol', 'occupation', 'Idol / ca sĩ', [/\bidol\b/, /\bsinger\b/, /\bpop star\b/, /\bvocalist\b/]),
  trait('maid', 'occupation', 'Hầu gái / quản gia', [/\b(?:is|was|works as) (?:a|the) (?:\w+ )?maid\b/, /\bhead maid\b/, /\bmaid (?:of|for|at|in|who)\b/, /\boccupation: maid\b/, /\bbutler\b/]),
  trait('detective', 'occupation', 'Thám tử', [/\bdetective\b/, /\binvestigator\b/]),
  trait('assassin', 'occupation', 'Sát thủ', [/\bassassin\b/, /\bhitman\b/, /\bkiller for hire\b/]),
  trait('ninja', 'occupation', 'Ninja / shinobi', [/\bninjas?\b/, /\bshinobi\b/, /\bkunoichi\b/]),
  trait('samurai', 'occupation', 'Samurai / kiếm sĩ', [/\bsamurai\b/, /\bswordsman\b/, /\bswordswoman\b/, /\bswordmaster\b/, /\bronin\b/]),
  trait('knight', 'occupation', 'Hiệp sĩ', [/\bknight\b/, /\bpaladin\b/]),
  trait('soldier', 'occupation', 'Quân nhân', [/\bsoldier\b/, /\bmilitary\b/, /\bsergeant\b/, /\blieutenant\b/, /\bcolonel\b/]),
  trait('leader', 'occupation', 'Thủ lĩnh / đội trưởng', [/\bcaptain\b/, /\bleader\b/, /\bcommander\b/, /\bboss of\b/]),
  trait('royalty', 'occupation', 'Hoàng tộc / quý tộc', [/\bprincess\b/, /\bprince\b/, /\bking of\b/, /\bqueen of\b/, /\broyal family\b/, /\broyalty\b/, /\bnoble family\b/, /\baristocrat\b/, /\bnoblewoman\b/, /\bnobleman\b/]),
  trait('doctor', 'occupation', 'Bác sĩ / y tá', [/\bdoctor\b/, /\bphysician\b/, /\bnurse\b/, /\bsurgeon\b/]),
  trait('scientist', 'occupation', 'Nhà khoa học', [/\bscientist\b/, /\bresearcher\b/, /\binventor\b/, /\bengineer\b/]),
  trait('pilot', 'occupation', 'Phi công', [/\bpilot\b/]),
  trait('hacker', 'occupation', 'Hacker', [/\bhacker\b/, /\bhacking\b/]),
  trait('mercenary', 'occupation', 'Lính đánh thuê / hải tặc', [/\bmercenary\b/, /\bpirate\b/, /\bbounty hunter\b/]),
  trait('athlete', 'occupation', 'Vận động viên', [/\bathlete\b/, /\bace (?:of|player|pitcher|striker)\b/, /\bteam'?s ace\b/, /\bvolleyball player\b/, /\bbasketball player\b/, /\bsoccer player\b/, /\bfootball player\b/, /\bbaseball player\b/, /\btennis player\b/]),
  trait('demon', 'species', 'Quỷ / ác ma', [/\bdemon\b/, /\bdemons\b/, /\bdevil\b/, /\boni\b/, /\byoukai\b/, /\byokai\b/]),
  trait('vampire', 'species', 'Ma cà rồng', [/\bvampire\b/]),
  trait('ghost', 'species', 'Hồn ma / tử thần', [/\bghost\b/, /\bshinigami\b/, /\bgrim reaper\b/, /\bsoul reaper\b/]),
  trait('divine', 'species', 'Thần / thiên thần', [/\bgoddess\b/, /\bdeity\b/, /\bangel\b/, /\bgod of\b/]),
  trait('android', 'species', 'Robot / android', [/\bandroid\b/, /\brobot\b/, /\bcyborg\b/, /\bartificial intelligence\b/, /\bautomaton\b/]),
  trait('magic-user', 'species', 'Pháp sư / phù thủy', [/\bwitch\b/, /\bwizard\b/, /\bmage\b/, /\bsorcerer\b/, /\bsorceress\b/, /\bmagician\b/, /\bmagic user\b/]),
  trait('magical-girl', 'species', 'Ma pháp thiếu nữ', [/\bmagical girl\b/, /\bmahou shoujo\b/]),
  trait('demi-human', 'species', 'Á nhân / thú nhân', [/\belf\b/, /\belven\b/, /\bdwarf\b/, /\bbeastman\b/, /\bbeast-?kin\b/, /\bcatgirl\b/, /\bcat girl\b/, /\bwerewolf\b/, /\bkitsune\b/, /\bdemi-human\b/]),
  trait('dragon', 'species', 'Rồng', [/\b(?:is|was|being|becomes) an? (?:\w+ )?dragon\b/, /\bdragon (?:form|race|clan|girl|kin|maid|god)\b/, /\bhalf-dragon\b/, /\bdragonkin\b/, /\bspecies: (?:\w+ )?dragon\b/, /\brace: (?:\w+ )?dragon\b/]),
  trait('undead', 'species', 'Zombie / undead', [/\bzombie\b/, /\bundead\b/, /\bghoul\b/]),
  trait('alien', 'species', 'Người ngoài hành tinh', [/\balien\b/, /\bextraterrestrial\b/]),
  trait('superpowered', 'species', 'Siêu năng lực', [/\bsupernatural (?:ability|abilities|power|powers)\b/, /\bpsychic\b/, /\besper\b/, /\btelekine(?:sis|tic)\b/, /\bquirk\b/]),
]

const TRAIT_BY_ID = new Map(TRAIT_LEXICON.map((entry) => [entry.id, entry]))
const MAX_SCAN_LENGTH = 2500
const MAX_EVIDENCE_LENGTH = 220

export function getTrait(id) {
  return TRAIT_BY_ID.get(id) ?? null
}

export function stripSpoilers(text) {
  return String(text ?? '').replace(/~![\s\S]*?(?:!~|$)/g, ' ')
}

function evidenceAround(text, index, length) {
  const before = text.lastIndexOf('\n', index)
  const sentenceStart = Math.max(before, ...['. ', '! ', '? '].map((mark) => text.lastIndexOf(mark, index) + 1))
  const ends = ['. ', '! ', '? ', '\n'].map((mark) => text.indexOf(mark, index + length)).filter((value) => value >= 0)
  const end = ends.length ? Math.min(...ends) + 1 : text.length
  let sentence = text.slice(Math.max(0, sentenceStart), end).replace(/\s+/g, ' ').trim()
  if (sentence.length > MAX_EVIDENCE_LENGTH) {
    const local = Math.max(0, index - Math.max(0, sentenceStart) - 80)
    sentence = `${local ? '…' : ''}${sentence.slice(local, local + MAX_EVIDENCE_LENGTH).trim()}…`
  }
  return sentence
}

export function deriveTraits(description) {
  const text = stripSpoilers(description)
    .replace(/__|\*\*|[_*]/g, '')
    .slice(0, MAX_SCAN_LENGTH)
  if (!text.trim()) return []
  const lower = text.toLowerCase()
  const results = []
  for (const entry of TRAIT_LEXICON) {
    let best = null
    for (const pattern of entry.patterns) {
      const match = pattern.exec(lower)
      if (match && (!best || match.index < best.index)) best = { index: match.index, length: match[0].length }
    }
    if (best) results.push({ traitId: entry.id, evidence: evidenceAround(text, best.index, best.length) })
  }
  return results
}
