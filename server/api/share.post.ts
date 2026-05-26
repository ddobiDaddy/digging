import { generateShareId } from '../utils/share-id'

// 익명으로 분석 결과를 저장하고 짧은 ID를 발급.
// 로그인/가입 없음. 누구나 결과 → ID 발급 → URL 공유 가능.

interface StoredShare {
  v: 1
  createdAt: number
  age: number
  region: string
  result: any
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body || !body.result) {
    throw createError({ statusCode: 400, message: '저장할 결과가 없습니다.' })
  }

  const storage = useStorage('shares')

  // 충돌 회피: 5회까지 재시도 (실질적으로는 첫 시도에서 성공)
  let id: string | null = null
  for (let i = 0; i < 5; i++) {
    const candidate = generateShareId(6)
    const exists = await storage.hasItem(candidate)
    if (!exists) {
      id = candidate
      break
    }
  }
  if (!id) {
    throw createError({ statusCode: 500, message: 'ID 생성에 실패했습니다.' })
  }

  const stored: StoredShare = {
    v: 1,
    createdAt: Date.now(),
    age: Number(body.age) || 0,
    region: String(body.region || ''),
    result: body.result,
  }

  await storage.setItem(id, stored)

  return { id }
})
