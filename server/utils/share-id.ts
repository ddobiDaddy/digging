// 짧은 익명 공유 ID 생성기.
// 가입/로그인 없이 모든 결과를 익명으로 식별하기 위한 6자리 base62.
// 충돌 확률: 약 56^6 ≈ 30억 분의 1 (한 사용자 기준). 추가로 저장 시 충돌 체크함.

const ALPHABET = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
// 헷갈리는 문자(0/O, 1/l/I) 제외 → 사람 눈으로도 안 헷갈림

export function generateShareId(length = 6): string {
  let id = ''
  for (let i = 0; i < length; i++) {
    id += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return id
}

export function isValidShareId(id: string): boolean {
  if (!id || id.length < 4 || id.length > 12) return false
  return /^[a-zA-Z0-9]+$/.test(id)
}
