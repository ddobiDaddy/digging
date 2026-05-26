export interface NaverPlace {
  name: string
  category: string
  address: string
  roadAddress: string
  telephone: string
  lng: number | null
  lat: number | null
  placeId: string | null
  link: string
}

function stripTags(s: string): string {
  return (s || '').replace(/<\/?b>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
}

function extractPlaceId(link: string): string | null {
  if (!link) return null
  const patterns = [
    /map\.naver\.com\/[^/]+\/entry\/place\/(\d+)/,
    /map\.naver\.com\/p\/entry\/place\/(\d+)/,
    /place\.map\.naver\.com\/(\d+)/,
    /place\.naver\.com\/(?:[^/]+\/)?(\d+)/,
    /\/place\/(\d+)/,
  ]
  for (const p of patterns) {
    const m = link.match(p)
    if (m) return m[1]
  }
  return null
}

// 한국 본토 위경도 범위 검증.
// lng (경도): 124~132, lat (위도): 33~39
function parseLng(raw: string): number | null {
  const n = Number(raw)
  if (!Number.isFinite(n)) return null
  const decimal = n / 10_000_000
  if (decimal >= 124 && decimal <= 132) return decimal
  return null
}

function parseLat(raw: string): number | null {
  const n = Number(raw)
  if (!Number.isFinite(n)) return null
  const decimal = n / 10_000_000
  if (decimal >= 33 && decimal <= 39) return decimal
  return null
}

export async function searchNaverPlaces(
  query: string,
  clientId: string,
  clientSecret: string,
  display = 5,
): Promise<NaverPlace[]> {
  if (!clientId || !clientSecret) return []
  if (!query?.trim()) return []

  try {
    const res = await $fetch<any>('https://openapi.naver.com/v1/search/local.json', {
      query: { query, display, sort: 'random' },
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
      timeout: 8000,
    })

    const items: any[] = res?.items ?? []
    return items.map((it): NaverPlace => {
      // mapx=경도, mapy=위도 가 표준이지만, 간혹 뒤바뀐 응답이 있어 양쪽 모두 시도
      let lng = parseLng(it.mapx)
      let lat = parseLat(it.mapy)
      if (lng === null || lat === null) {
        const swappedLng = parseLng(it.mapy)
        const swappedLat = parseLat(it.mapx)
        if (swappedLng !== null && swappedLat !== null) {
          lng = swappedLng
          lat = swappedLat
        }
      }
      return {
        name: stripTags(it.title),
        category: it.category || '',
        address: it.address || '',
        roadAddress: it.roadAddress || it.address || '',
        telephone: it.telephone || '',
        lng,
        lat,
        placeId: extractPlaceId(it.link),
        link: it.link || '',
      }
    })
  } catch (err) {
    // 한 키워드 실패가 전체를 막지 않도록 빈 배열 반환
    return []
  }
}
