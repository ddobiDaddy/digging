import { SIDO_LIST, DISTRICTS, NEIGHBORHOODS, type Sido } from './regions'

export interface ParsedInput {
  age: number | null
  regionSido: Sido | ''
  regionDistrict: string
  regionNeighborhood: string
  traits: string[]
  memo: string
  /** UI에 "인식됨" 으로 보여줄 항목 */
  recognized: string[]
}

// traitOptions.value 와 동일한 value 문자열
const TRAIT_RULES: { keywords: string[]; value: string; label: string }[] = [
  { keywords: ['만들기', '레고', '조립', '만들', 'diy', '목공'], value: '혼자 조용히 뭔가 만들길 좋아함', label: '만들기' },
  { keywords: ['사교', '친구', '리더', '어울', '놀이친구'], value: '친구들과 어울리길 좋아하고 리더십이 있음', label: '사교성' },
  { keywords: ['자연', '동물', '식물', '곤충', '반려'], value: '동물이나 식물에 관심이 많음', label: '자연' },
  { keywords: ['책', '이야기', '동화', '읽기', '독서'], value: '책이나 이야기에 빠져듦', label: '책' },
  { keywords: ['숫자', '규칙', '수학', '퍼즐', '체스'], value: '숫자나 규칙에 관심이 많음', label: '숫자·규칙' },
  { keywords: ['그림', '색칠', '미술', '드로잉', '그리'], value: '그림 그리기나 색칠을 즐김', label: '그림' },
  { keywords: ['활동', '운동', '뛰', '축구', '농구', '달리'], value: '몸을 움직이는 활동을 좋아함', label: '활동적' },
  { keywords: ['음악', '노래', '악기', '피아노', '리듬'], value: '음악이나 노래에 반응이 빠름', label: '음악' },
  { keywords: ['질문', '왜', '호기심', '궁금'], value: '왜 그런지 질문을 많이 함', label: '호기심' },
  { keywords: ['도전', '새로운', '모험', '시도'], value: '새로운 것에 거부감이 적고 도전적임', label: '도전' },
  { keywords: ['공감', '감정', '눈물', '배려'], value: '감정이 풍부하고 공감을 잘함', label: '공감' },
  { keywords: ['집중', '몰두', '오래', '한가지'], value: '집중력이 강하고 한 가지에 몰두함', label: '집중' },
]

const SIDO_ALIASES: Record<string, Sido> = {
  서울: '서울',
  서울시: '서울',
  서울특별시: '서울',
  경기: '경기',
  경기도: '경기',
  인천: '인천',
  인천광역시: '인천',
  부산: '부산',
  부산광역시: '부산',
  대구: '대구',
  대구광역시: '대구',
  대전: '대전',
  대전광역시: '대전',
  광주: '광주',
  광주광역시: '광주',
  울산: '울산',
  울산광역시: '울산',
  세종: '세종',
  세종시: '세종',
  세종특별자치시: '세종',
  강원: '강원',
  강원도: '강원',
  충북: '충북',
  충청북도: '충북',
  충남: '충남',
  충청남도: '충남',
  전북: '전북',
  전라북도: '전북',
  전남: '전남',
  전라남도: '전남',
  경북: '경북',
  경상북도: '경북',
  경남: '경남',
  경상남도: '경남',
  제주: '제주',
  제주도: '제주',
  제주특별자치도: '제주',
}

function parseAge(text: string): number | null {
  const m1 = text.match(/(\d{1,2})\s*(?:살|세)(?!\w)/)
  if (m1) {
    const n = Number(m1[1])
    if (n >= 3 && n <= 15) return n
  }
  const m2 = text.match(/(?:아이|아들|딸|우리)\s*(?:는\s*)?(\d{1,2})/)
  if (m2) {
    const n = Number(m2[1])
    if (n >= 3 && n <= 15) return n
  }
  return null
}

function findSido(text: string): Sido | '' {
  const keys = Object.keys(SIDO_ALIASES).sort((a, b) => b.length - a.length)
  for (const key of keys) {
    if (text.includes(key)) return SIDO_ALIASES[key]
  }
  return ''
}

function findDistrict(text: string, sido: Sido | ''): string {
  const searchIn = (s: Sido) => {
    const list = DISTRICTS[s] || []
    const sorted = [...list].sort((a, b) => b.length - a.length)
    for (const d of sorted) {
      if (text.includes(d)) return d
      const short = d.replace(/(시|군|구)$/, '')
      if (short.length >= 2 && text.includes(short)) return d
    }
    return ''
  }
  if (sido) return searchIn(sido)
  for (const s of SIDO_LIST) {
    const found = searchIn(s)
    if (found) return found
  }
  return ''
}

function findNeighborhood(text: string, sido: Sido | '', district: string): string {
  if (!sido || !district) return ''
  const list = NEIGHBORHOODS[sido]?.[district] || []
  const sorted = [...list].sort((a, b) => b.length - a.length)
  for (const n of sorted) {
    if (text.includes(n)) return n
    const short = n.replace(/동$/, '')
    if (short.length >= 2 && text.includes(short + '동')) return n
  }
  return ''
}

function inferSidoFromDistrict(district: string): Sido | '' {
  if (!district) return ''
  for (const s of SIDO_LIST) {
    if ((DISTRICTS[s] || []).includes(district)) return s
  }
  return ''
}

function parseTraits(text: string): { traits: string[]; labels: string[] } {
  const traits: string[] = []
  const labels: string[] = []
  const lower = text.toLowerCase()
  for (const rule of TRAIT_RULES) {
    if (rule.keywords.some((k) => lower.includes(k.toLowerCase()) || text.includes(k))) {
      if (!traits.includes(rule.value)) {
        traits.push(rule.value)
        labels.push(rule.label)
      }
    }
  }
  return { traits, labels }
}

function buildMemo(original: string, strippedParts: string[]): string {
  let memo = original
  for (const part of strippedParts.sort((a, b) => b.length - a.length)) {
    if (part) memo = memo.split(part).join(' ')
  }
  memo = memo
    .replace(/\d{1,2}\s*(?:살|세)/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[,.，]/g, ' ')
    .trim()
  return memo.length >= 4 ? memo : ''
}

export function parseNaturalInput(raw: string): ParsedInput {
  const text = raw.trim()
  const recognized: string[] = []

  if (!text) {
    return {
      age: null,
      regionSido: '',
      regionDistrict: '',
      regionNeighborhood: '',
      traits: [],
      memo: '',
      recognized: [],
    }
  }

  const age = parseAge(text)
  if (age) recognized.push(`${age}세`)

  let regionSido = findSido(text)
  let regionDistrict = findDistrict(text, regionSido)
  if (!regionSido && regionDistrict) {
    regionSido = inferSidoFromDistrict(regionDistrict)
  }
  const regionNeighborhood = findNeighborhood(text, regionSido, regionDistrict)

  if (regionSido) recognized.push(regionSido)
  if (regionDistrict) recognized.push(regionDistrict)
  if (regionNeighborhood) recognized.push(regionNeighborhood)

  const { traits, labels } = parseTraits(text)
  if (labels.length) recognized.push(...labels)

  const stripped = [
    ...labels,
    regionNeighborhood,
    regionDistrict,
    regionSido,
    ...(regionSido ? Object.keys(SIDO_ALIASES).filter((k) => SIDO_ALIASES[k] === regionSido) : []),
  ]
  const memo = buildMemo(text, stripped)

  if (memo && !traits.length) recognized.push('추가 설명')

  return {
    age,
    regionSido,
    regionDistrict,
    regionNeighborhood,
    traits,
    memo: memo || (traits.length === 0 ? text : ''),
    recognized,
  }
}

/** 역지오코딩 API 응답 → 폼 지역 필드 */
export function mapGeocodeToRegion(parts: {
  sido?: string
  sigungu?: string
  dong?: string
}): Pick<ParsedInput, 'regionSido' | 'regionDistrict' | 'regionNeighborhood' | 'recognized'> {
  const recognized: string[] = ['내 위치']
  let regionSido: Sido | '' = ''
  let regionDistrict = ''
  let regionNeighborhood = ''

  const rawSido = (parts.sido || '').replace(/\s/g, '')
  for (const [alias, s] of Object.entries(SIDO_ALIASES)) {
    if (rawSido.includes(alias) || alias.includes(rawSido)) {
      regionSido = s
      break
    }
  }
  if (!regionSido && rawSido) {
    const short = rawSido.replace(/(특별|광역|자치)?(시|도)/g, '').slice(0, 2)
    const hit = SIDO_LIST.find((s) => rawSido.startsWith(s) || s.startsWith(short))
    if (hit) regionSido = hit
  }

  const areaText = [parts.sigungu, parts.dong].filter(Boolean).join(' ')
  regionDistrict = findDistrict(areaText, regionSido) || findDistrict(areaText, '')
  if (!regionSido && regionDistrict) regionSido = inferSidoFromDistrict(regionDistrict)

  if (parts.dong) {
    regionNeighborhood = findNeighborhood(parts.dong, regionSido, regionDistrict)
    if (!regionNeighborhood && parts.dong.includes('동')) regionNeighborhood = parts.dong
  }

  if (regionSido) recognized.push(regionSido)
  if (regionDistrict) recognized.push(regionDistrict)
  if (regionNeighborhood) recognized.push(regionNeighborhood)

  return { regionSido, regionDistrict, regionNeighborhood, recognized }
}
