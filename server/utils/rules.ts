// 성향 기반 룰 엔진. AI(Ollama) 대신 사용.
// 이 파일을 수정하면 추천 결과가 즉시 바뀝니다. 추천 품질 튜닝은 모두 여기서.

export type Category = '예술' | '과학' | '스포츠' | '사회' | '자연' | '기술' | '음악' | '문학'

export interface ExperienceItem {
  name: string
  category: Category
  desc: string
  why: string
  age_fit: string
  search_keywords: string[]
}

export interface StrengthItem {
  name: string
  desc: string
  icon: string
}

export interface RuleResult {
  summary: string
  strengths: StrengthItem[]
  experiences: ExperienceItem[]
}

// ---- 성향 키 (pages/index.vue 의 traitOptions value 와 동일하게 유지) ----
const T = {
  MAKER: '혼자 조용히 뭔가 만들길 좋아함',
  SOCIAL: '친구들과 어울리길 좋아하고 리더십이 있음',
  NATURE: '동물이나 식물에 관심이 많음',
  BOOK: '책이나 이야기에 빠져듦',
  LOGIC: '숫자나 규칙에 관심이 많음',
  ART: '그림 그리기나 색칠을 즐김',
  ACTIVE: '몸을 움직이는 활동을 좋아함',
  MUSIC: '음악이나 노래에 반응이 빠름',
  CURIOUS: '왜 그런지 질문을 많이 함',
  ADVENTUROUS: '새로운 것에 거부감이 적고 도전적임',
  EMPATHETIC: '감정이 풍부하고 공감을 잘함',
  FOCUSED: '집중력이 강하고 한 가지에 몰두함',
} as const

type TraitKey = (typeof T)[keyof typeof T]

// ---- 강점 (성향 → 강점 1개씩) ----
const STRENGTH_BY_TRAIT: Record<TraitKey, StrengthItem> = {
  [T.MAKER]: { name: '손재주와 집중력', desc: '뭔가를 직접 만들 때 시간 가는 줄 모르고 몰두해요. 손끝으로 생각을 표현하는 능력이 강합니다.', icon: '🛠️' },
  [T.SOCIAL]: { name: '사교성과 리더십', desc: '사람들 사이에서 에너지를 얻고, 자연스럽게 분위기를 이끌어요. 협업할 때 빛이 납니다.', icon: '🤝' },
  [T.NATURE]: { name: '관찰력과 자연 친화력', desc: '주변의 작은 생명에 눈을 두고 오래 들여다봐요. 변화와 패턴을 잘 잡아냅니다.', icon: '🌿' },
  [T.BOOK]: { name: '상상력과 언어 감각', desc: '이야기 속 세계로 푹 빠져 들어가요. 단어와 표현이 풍부해서 자기 생각을 잘 풀어냅니다.', icon: '📖' },
  [T.LOGIC]: { name: '논리력과 분석력', desc: '숫자와 규칙 안에서 안정감을 느껴요. 복잡한 것을 단순한 구조로 정리하는 데 능합니다.', icon: '🧩' },
  [T.ART]: { name: '표현력과 미적 감각', desc: '색과 선으로 자기 감정을 풀어내요. 작은 디테일에서 아름다움을 발견하는 눈이 있습니다.', icon: '🎨' },
  [T.ACTIVE]: { name: '신체 감각과 활동성', desc: '몸을 움직일 때 에너지가 솟아요. 몸으로 익히는 학습이 가장 빠른 타입입니다.', icon: '⚽' },
  [T.MUSIC]: { name: '음감과 리듬감', desc: '소리에 빠르게 반응하고 박자를 자연스럽게 타요. 청각 기억력이 좋습니다.', icon: '🎵' },
  [T.CURIOUS]: { name: '호기심과 탐구심', desc: '"왜"라는 질문을 멈추지 않아요. 모르는 것이 있으면 끝까지 파보는 끈기가 있습니다.', icon: '🔍' },
  [T.ADVENTUROUS]: { name: '도전 정신과 모험심', desc: '새로운 것에 두려움보다 호기심이 앞서요. 작은 실패도 다음 도전의 발판으로 삼습니다.', icon: '🚀' },
  [T.EMPATHETIC]: { name: '공감 능력과 정서 지능', desc: '다른 사람의 감정을 잘 읽고 함께 느껴요. 사람 사이의 분위기를 빠르게 알아차립니다.', icon: '💛' },
  [T.FOCUSED]: { name: '몰입력과 끈기', desc: '한번 빠지면 깊이 들어가요. 시간 가는 줄 모르고 하나를 끝까지 파고드는 힘이 있습니다.', icon: '🎯' },
}

// ---- 성향 → 짧은 형용사구 (summary 만들 때 사용) ----
const ADJ_BY_TRAIT: Record<TraitKey, string> = {
  [T.MAKER]: '만들기를 좋아하는',
  [T.SOCIAL]: '사교적인',
  [T.NATURE]: '자연을 사랑하는',
  [T.BOOK]: '책을 좋아하는',
  [T.LOGIC]: '논리적인',
  [T.ART]: '그림 그리는 걸 좋아하는',
  [T.ACTIVE]: '활동적인',
  [T.MUSIC]: '음악을 좋아하는',
  [T.CURIOUS]: '호기심 많은',
  [T.ADVENTUROUS]: '도전을 즐기는',
  [T.EMPATHETIC]: '공감 능력이 풍부한',
  [T.FOCUSED]: '집중력이 깊은',
}

// ---- 체험 라이브러리 ----
// matches: 어떤 성향들이 이 체험과 잘 맞는지 (점수 매기는 기준)
interface ExperienceTemplate extends ExperienceItem {
  matches: TraitKey[]
  ageMin: number
  ageMax: number
}

const EXPERIENCES: ExperienceTemplate[] = [
  {
    name: '도자기 공방',
    category: '예술',
    desc: '점토를 직접 빚고 굽는 손작업 체험.',
    why: '손끝의 감각과 집중력을 동시에 키울 수 있어요.',
    age_fit: '6~13세',
    search_keywords: ['도자기 공방', '어린이 도예 체험'],
    matches: [T.MAKER, T.FOCUSED, T.ART],
    ageMin: 6, ageMax: 13,
  },
  {
    name: '목공방 / DIY 체험',
    category: '예술',
    desc: '나무로 작은 가구나 장난감을 직접 만들어보는 활동.',
    why: '도구를 다루며 만들기의 성취감을 충분히 맛볼 수 있어요.',
    age_fit: '7~14세',
    search_keywords: ['어린이 목공방', '키즈 DIY 체험'],
    matches: [T.MAKER, T.FOCUSED, T.ADVENTUROUS],
    ageMin: 7, ageMax: 14,
  },
  {
    name: '어린이 미술 클래스',
    category: '예술',
    desc: '그림·색채 표현 중심의 정기 클래스.',
    why: '머릿속 이미지를 손으로 풀어내는 연습이 자연스럽게 됩니다.',
    age_fit: '4~12세',
    search_keywords: ['어린이 미술학원', '키즈 아트 클래스'],
    matches: [T.ART, T.MAKER, T.EMPATHETIC],
    ageMin: 4, ageMax: 13,
  },
  {
    name: '어린이 코딩 학원',
    category: '기술',
    desc: '스크래치·로봇 키트로 시작하는 기초 코딩 수업.',
    why: '논리적으로 단계를 쪼개 생각하는 힘을 키워줘요.',
    age_fit: '7~14세',
    search_keywords: ['어린이 코딩 학원', '키즈 코딩 교육'],
    matches: [T.LOGIC, T.CURIOUS, T.FOCUSED],
    ageMin: 7, ageMax: 15,
  },
  {
    name: '보드게임 카페',
    category: '사회',
    desc: '또래와 룰을 익히며 즐기는 보드게임 공간.',
    why: '규칙 이해와 또래 협상을 동시에 연습할 수 있어요.',
    age_fit: '6~13세',
    search_keywords: ['보드게임 카페', '키즈 보드게임'],
    matches: [T.SOCIAL, T.LOGIC, T.ADVENTUROUS],
    ageMin: 6, ageMax: 14,
  },
  {
    name: '키즈 클라이밍',
    category: '스포츠',
    desc: '안전한 어린이용 클라이밍 벽에서 도전하는 체험.',
    why: '몸을 쓰며 한 번에 하나의 목표에 집중하는 경험이 됩니다.',
    age_fit: '5~13세',
    search_keywords: ['키즈 클라이밍', '어린이 클라이밍'],
    matches: [T.ACTIVE, T.ADVENTUROUS, T.FOCUSED],
    ageMin: 5, ageMax: 14,
  },
  {
    name: '어린이 박물관',
    category: '과학',
    desc: '체험형 전시로 가득한 박물관/과학관.',
    why: '"왜"라는 질문을 만질 수 있는 답으로 바꿔주는 공간이에요.',
    age_fit: '4~12세',
    search_keywords: ['어린이 박물관', '어린이 과학관'],
    matches: [T.CURIOUS, T.BOOK, T.ADVENTUROUS],
    ageMin: 4, ageMax: 13,
  },
  {
    name: '트램폴린파크',
    category: '스포츠',
    desc: '뛰고 구르며 에너지를 발산할 수 있는 실내 점프장.',
    why: '몸을 마음껏 쓰면서 균형감과 자신감을 키울 수 있어요.',
    age_fit: '4~14세',
    search_keywords: ['트램폴린파크', '키즈 점프파크'],
    matches: [T.ACTIVE, T.ADVENTUROUS, T.SOCIAL],
    ageMin: 4, ageMax: 15,
  },
  {
    name: '식물원 / 수목원',
    category: '자연',
    desc: '계절마다 다른 식물을 관찰하는 야외 체험.',
    why: '느린 변화를 들여다보는 관찰력을 키울 수 있어요.',
    age_fit: '4~14세',
    search_keywords: ['식물원', '수목원'],
    matches: [T.NATURE, T.CURIOUS, T.FOCUSED],
    ageMin: 4, ageMax: 15,
  },
  {
    name: '동물 체험 / 동물원',
    category: '자연',
    desc: '동물을 가까이서 보고 먹이 주기 등을 체험.',
    why: '생명을 돌보는 감정과 책임감을 자연스럽게 익혀요.',
    age_fit: '4~12세',
    search_keywords: ['어린이 동물원', '동물 체험'],
    matches: [T.NATURE, T.EMPATHETIC, T.CURIOUS],
    ageMin: 4, ageMax: 13,
  },
  {
    name: '어린이 도서관 프로그램',
    category: '문학',
    desc: '동화 구연·독후 활동·작가 만남이 있는 도서관 정기 프로그램.',
    why: '이야기에 깊이 빠지는 성향을 활동으로 연결해 줍니다.',
    age_fit: '5~13세',
    search_keywords: ['어린이 도서관', '어린이 독서 프로그램'],
    matches: [T.BOOK, T.EMPATHETIC, T.FOCUSED],
    ageMin: 5, ageMax: 14,
  },
  {
    name: '어린이 음악 교실',
    category: '음악',
    desc: '리듬·악기 체험 중심의 정기 클래스.',
    why: '소리로 자기를 표현하는 통로를 열어줍니다.',
    age_fit: '4~13세',
    search_keywords: ['어린이 음악학원', '키즈 악기 체험'],
    matches: [T.MUSIC, T.EMPATHETIC, T.SOCIAL],
    ageMin: 4, ageMax: 14,
  },
  {
    name: '어린이 연극 / 뮤지컬 체험',
    category: '예술',
    desc: '연기·무대 표현을 직접 해보는 어린이 공연 수업.',
    why: '감정을 몸과 목소리로 표현하는 경험이 자존감을 키워요.',
    age_fit: '6~13세',
    search_keywords: ['어린이 연극', '키즈 뮤지컬 클래스'],
    matches: [T.SOCIAL, T.EMPATHETIC, T.MUSIC],
    ageMin: 6, ageMax: 14,
  },
  {
    name: '어린이 요리 클래스',
    category: '예술',
    desc: '재료를 직접 다듬고 조리하는 베이킹·요리 수업.',
    why: '계량과 순서를 지키며 결과물을 만드는 성취감이 큽니다.',
    age_fit: '5~13세',
    search_keywords: ['어린이 쿠킹 클래스', '키즈 베이킹 클래스'],
    matches: [T.MAKER, T.SOCIAL, T.FOCUSED],
    ageMin: 5, ageMax: 14,
  },
  {
    name: '레고 / 블록 클래스',
    category: '기술',
    desc: '블록과 키트를 활용한 구조 설계·로봇 수업.',
    why: '논리적 설계와 손 조립이 동시에 일어나는 활동이에요.',
    age_fit: '5~12세',
    search_keywords: ['레고 교실', '키즈 로보틱스'],
    matches: [T.LOGIC, T.MAKER, T.FOCUSED],
    ageMin: 5, ageMax: 13,
  },
  {
    name: '키즈카페 / 놀이체험관',
    category: '사회',
    desc: '실내에서 다양한 놀이를 즐길 수 있는 또래 공간.',
    why: '자유롭게 뛰놀며 또래와 어울리는 시간이 됩니다.',
    age_fit: '3~9세',
    search_keywords: ['키즈카페', '실내 놀이체험관'],
    matches: [T.SOCIAL, T.ACTIVE, T.ADVENTUROUS],
    ageMin: 3, ageMax: 10,
  },
]

// ---- 추천 알고리즘 ----
export function buildRecommendation(
  age: number,
  traits: string[],
): RuleResult {
  const selected = (traits || []).filter((t): t is TraitKey =>
    Object.values(T).includes(t as TraitKey),
  )

  // 점수 매기기
  const scored = EXPERIENCES.map((e) => {
    const matchCount = e.matches.filter((m) => selected.includes(m)).length
    const inAge = age >= e.ageMin && age <= e.ageMax
    // 기본 점수: 일치 성향 수. 나이 적합하면 +0.5, 벗어나면 -0.5 (단, 0 이하로는 안 떨어뜨림)
    let score = matchCount
    if (inAge) score += 0.5
    else if (matchCount > 0) score = Math.max(score - 0.5, 0.1)
    return { exp: e, score, inAge }
  })

  let picks = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)

  // 카테고리 다양성: 같은 카테고리 최대 2개까지만
  const perCategory: Record<string, number> = {}
  const diverse: typeof picks = []
  for (const p of picks) {
    const cnt = perCategory[p.exp.category] || 0
    if (cnt >= 2) continue
    diverse.push(p)
    perCategory[p.exp.category] = cnt + 1
    if (diverse.length >= 6) break
  }

  // 만약 성향이 하나도 안 골라졌으면(메모만 입력) 나이 맞는 인기 카테고리에서 6개 픽
  if (diverse.length === 0) {
    const fallback = EXPERIENCES.filter((e) => age >= e.ageMin && age <= e.ageMax).slice(0, 6)
    diverse.push(...fallback.map((e) => ({ exp: e, score: 1, inAge: true })))
  }

  // 강점: 선택한 성향 순서대로 최대 3개
  const strengths: StrengthItem[] = selected
    .slice(0, 3)
    .map((t) => STRENGTH_BY_TRAIT[t])
    .filter(Boolean)

  // 강점이 비어있을 때 (메모만 입력) - 기본 강점 1개
  if (strengths.length === 0) {
    strengths.push({
      name: '잠재된 다양성',
      desc: '아직 한 가지로 정의되지 않는, 여러 방향이 열려 있는 시기예요. 다양한 체험에 노출되면서 자기 모양을 찾아갈 수 있습니다.',
      icon: '🌱',
    })
  }

  // 한 줄 요약
  const adjs = selected.slice(0, 3).map((t) => ADJ_BY_TRAIT[t]).filter(Boolean)
  let summary: string
  if (adjs.length === 0) {
    summary = `다양한 가능성을 품은 ${age}세 아이`
  } else if (adjs.length === 1) {
    summary = `${adjs[0]} ${age}세 아이`
  } else {
    summary = `${adjs.slice(0, -1).join(', ')}이면서 ${adjs[adjs.length - 1]} ${age}세 아이`
  }

  return {
    summary,
    strengths,
    experiences: diverse.map(({ exp }) => ({
      name: exp.name,
      category: exp.category,
      desc: exp.desc,
      why: exp.why,
      age_fit: exp.age_fit,
      search_keywords: exp.search_keywords,
    })),
  }
}
