import { searchNaverPlaces, type NaverPlace } from '../utils/naver'
import { buildRecommendation, type RuleResult } from '../utils/rules'

interface Experience {
  name: string
  category: string
  desc: string
  why: string
  age_fit: string
  search_keywords?: string[]
  places?: NaverPlace[]
}

interface AnalyzeResult {
  summary: string
  strengths: { name: string; desc: string; icon: string }[]
  experiences: Experience[]
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  const { age, traits, memo, region } = body

  if ((!traits || traits.length === 0) && !memo) {
    throw createError({ statusCode: 400, message: '입력값이 없습니다.' })
  }

  let analyzeResult: AnalyzeResult

  if (config.useAi) {
    // ── AI 경로 (Ollama) ──────────────────────────────────
    // 현재는 사용 안 함. USE_AI=true 로 켜면 다시 사용 가능.
    // TODO.md 의 "AI 재활성화" 섹션 참고.
    analyzeResult = await callOllama(config, { age, traits, memo, region })
  } else {
    // ── 룰 기반 경로 (기본) ──────────────────────────────
    // server/utils/rules.ts 의 라이브러리를 기반으로 결정론적으로 생성.
    const ruleResult: RuleResult = buildRecommendation(Number(age) || 7, traits || [])
    analyzeResult = ruleResult as AnalyzeResult
  }

  // ── 네이버 지역검색으로 실제 장소 붙이기 ────────────────
  const hasNaver = !!(config.naverClientId && config.naverClientSecret)
  if (hasNaver && Array.isArray(analyzeResult.experiences)) {
    analyzeResult.experiences = await Promise.all(
      analyzeResult.experiences.map(async (exp): Promise<Experience> => {
        const keywords: string[] =
          exp.search_keywords && exp.search_keywords.length > 0
            ? exp.search_keywords
            : [exp.name]

        const primary = (region ? `${region} ` : '') + keywords[0]
        let places = await searchNaverPlaces(
          primary,
          config.naverClientId,
          config.naverClientSecret,
          5,
        )

        if (places.length < 2 && keywords[1]) {
          const secondary = (region ? `${region} ` : '') + keywords[1]
          const more = await searchNaverPlaces(
            secondary,
            config.naverClientId,
            config.naverClientSecret,
            5,
          )
          const seen = new Set(places.map((p) => p.placeId || `${p.name}|${p.address}`))
          for (const p of more) {
            const key = p.placeId || `${p.name}|${p.address}`
            if (!seen.has(key)) {
              places.push(p)
              seen.add(key)
            }
          }
        }

        return { ...exp, places }
      }),
    )
  }

  return analyzeResult
})

// ───────────────────────────────────────────────────────────
// AI(Ollama) 호출 — 현재는 USE_AI=true 일 때만 사용. 보관용.
// ───────────────────────────────────────────────────────────
async function callOllama(
  config: any,
  input: { age?: number; traits?: string[]; memo?: string; region?: string },
): Promise<AnalyzeResult> {
  const { age, traits, memo, region } = input

  const prompt = `당신은 아동 발달 전문가입니다. 아래 아이의 정보를 분석해서 JSON으로 응답하세요.

나이: ${age}세
관찰된 성향: ${traits && traits.length > 0 ? traits.join(', ') : '없음'}
추가 메모: ${memo || '없음'}
${region ? `사는 지역: ${region}` : ''}

다음 구조로만 응답하세요. JSON 외에 아무것도 쓰지 마세요:
{
  "summary": "이 아이를 한 문장으로 표현",
  "strengths": [
    {"name": "강점 이름 (한 단어)", "desc": "이 강점이 어떻게 나타나는지 2문장으로", "icon": "이모지 하나"}
  ],
  "experiences": [
    {
      "name": "체험/활동명",
      "category": "예술|과학|스포츠|사회|자연|기술|음악|문학",
      "desc": "어떤 활동인지 1문장",
      "why": "이 아이에게 왜 맞는지 1문장",
      "age_fit": "추천 연령대",
      "search_keywords": ["네이버 지도에서 검색하면 잘 나올 일반명사 키워드 2~3개"]
    }
  ]
}

규칙: 강점 2~3개, 체험 5~6개. search_keywords는 일반명사 위주로.`

  let ollamaResponse: any
  try {
    ollamaResponse = await $fetch<any>(`${config.ollamaBaseUrl}/api/chat`, {
      method: 'POST',
      body: {
        model: config.ollamaModel,
        messages: [{ role: 'user', content: prompt }],
        format: 'json',
        stream: false,
        options: { temperature: 0.7 },
      },
      timeout: 120000,
    })
  } catch {
    throw createError({
      statusCode: 503,
      message: `Ollama 서버에 연결할 수 없습니다 (${config.ollamaBaseUrl}). 'ollama serve' 가 실행 중이고 모델이 받아졌는지 확인하세요.`,
    })
  }

  const text: string = ollamaResponse?.message?.content ?? ''
  const clean = text.replace(/```json|```/g, '').trim()

  try {
    return JSON.parse(clean)
  } catch {
    throw createError({ statusCode: 500, message: 'AI 응답 파싱 실패' })
  }
}
