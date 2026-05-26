// 브라우저 위치 → 한국 행정구역 (Nominatim 역지오코딩, API 키 불필요)

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const lat = Number(query.lat)
  const lng = Number(query.lng)

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw createError({ statusCode: 400, message: '위치 좌표가 올바르지 않습니다.' })
  }

  // 한국 대략 범위
  if (lat < 33 || lat > 39 || lng < 124 || lng > 132) {
    throw createError({ statusCode: 400, message: '한국 내 위치만 지원해요.' })
  }

  try {
    const res = await $fetch<any>('https://nominatim.openstreetmap.org/reverse', {
      query: {
        lat,
        lon: lng,
        format: 'json',
        'accept-language': 'ko',
        addressdetails: 1,
      },
      headers: {
        'User-Agent': 'DiggingApp/1.0 (child-experience-recommendation)',
      },
      timeout: 10000,
    })

    const addr = res?.address || {}
    const sido =
      addr.state ||
      addr.province ||
      addr.city ||
      ''
    const sigungu =
      addr.city_district ||
      addr.borough ||
      addr.county ||
      addr.city ||
      ''
    const dong =
      addr.suburb ||
      addr.quarter ||
      addr.neighbourhood ||
      addr.town ||
      ''

    return {
      sido: String(sido),
      sigungu: String(sigungu),
      dong: String(dong),
      displayName: res?.display_name || '',
    }
  } catch {
    throw createError({ statusCode: 502, message: '위치를 주소로 바꾸지 못했어요.' })
  }
})
