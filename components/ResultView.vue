<template>
  <div class="result-view">
    <header class="result-header">
      <div>
        <h1 class="result-name">{{ headerTitle }}</h1>
        <p class="result-summary">{{ result.summary }}</p>
      </div>
      <slot name="header-action" />
    </header>

    <section class="result-section">
      <h2 class="result-section-title">⭐ 발견된 강점</h2>
      <div v-for="s in result.strengths" :key="s.name" class="strength-card">
        <div class="strength-header">
          <span class="strength-icon">{{ s.icon }}</span>
          <span class="strength-name">{{ s.name }}</span>
        </div>
        <p class="strength-desc">{{ s.desc }}</p>
      </div>
    </section>

    <section class="result-section">
      <h2 class="result-section-title">📍 추천 체험</h2>
      <div v-for="e in result.experiences" :key="e.name" class="exp-card">
        <div class="exp-header">
          <span class="exp-name">{{ e.name }}</span>
          <span class="exp-badge" :class="`cat-${categoryClass(e.category)}`">{{ e.category }}</span>
        </div>
        <p class="exp-desc">{{ e.desc }}</p>
        <div class="exp-meta">
          <span class="exp-age">🗓 {{ e.age_fit }}</span>
        </div>
        <div class="exp-why">🔗 {{ e.why }}</div>

        <div v-if="e.places && e.places.length > 0" class="places-section">
          <div class="places-title">
            📍 {{ region ? `${region} 추천 장소` : '추천 장소' }}
            <span class="places-count">{{ e.places.length }}곳</span>
          </div>
          <div
            v-for="(p, i) in (expanded[e.name] ? e.places : e.places.slice(0, 2))"
            :key="(p.placeId || p.name) + i"
            class="place-card"
          >
            <div class="place-header">
              <span class="place-name">{{ p.name }}</span>
              <span class="place-cat">{{ p.category }}</span>
            </div>
            <p v-if="p.roadAddress || p.address" class="place-addr">📌 {{ p.roadAddress || p.address }}</p>
            <p v-if="p.telephone" class="place-tel">📞 {{ p.telephone }}</p>
            <div class="place-actions">
              <a class="place-btn primary" :href="mapUrl(p)" target="_blank" rel="noopener">🗺 지도보기</a>
              <a class="place-btn" :href="directionsUrl(p)" target="_blank" rel="noopener">🧭 길찾기</a>
              <a v-if="p.telephone" class="place-btn" :href="`tel:${p.telephone}`">📞 전화</a>
            </div>
          </div>
          <button
            v-if="e.places.length > 2"
            class="more-btn"
            @click="expanded[e.name] = !expanded[e.name]"
          >
            {{ expanded[e.name] ? '▲ 접기' : `▼ ${e.places.length - 2}곳 더 보기` }}
          </button>
        </div>

        <div v-else class="places-empty">
          <p class="places-empty-text">
            {{ region ? `'${region}' 근처에서 검색된 장소가 없어요.` : '실제 장소를 보려면 분석 시 동네를 선택해주세요.' }}
          </p>
          <a class="place-btn" :href="genericSearchUrl(e)" target="_blank" rel="noopener">
            🔍 네이버 지도에서 직접 검색
          </a>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
interface Place {
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

interface Experience {
  name: string
  category: string
  desc: string
  why: string
  age_fit: string
  search_keywords?: string[]
  places?: Place[]
}

interface AnalyzeResult {
  summary: string
  strengths: { name: string; desc: string; icon: string }[]
  experiences: Experience[]
}

const props = defineProps<{
  result: AnalyzeResult
  age: number
  region: string
}>()

const expanded = reactive<Record<string, boolean>>({})

const headerTitle = computed(() => `${props.age}세 아이의 디깅 결과`)

function categoryClass(cat: string): string {
  const map: Record<string, string> = {
    예술: 'art', 과학: 'science', 스포츠: 'sports', 사회: 'social',
    자연: 'nature', 기술: 'tech', 음악: 'music', 문학: 'literature',
  }
  return map[cat] || 'default'
}

function mapUrl(p: Place): string {
  if (p.placeId && p.lng !== null && p.lat !== null) {
    return `https://map.naver.com/p/entry/place/${p.placeId}?c=${p.lng},${p.lat},17,0,0,0,dh&placePath=%2Fhome`
  }
  if (p.placeId) {
    return `https://map.naver.com/p/entry/place/${p.placeId}?placePath=%2Fhome`
  }
  if (p.lng !== null && p.lat !== null) {
    return `https://map.naver.com/p/search/${encodeURIComponent(p.name)}?c=${p.lng},${p.lat},17,0,0,0,dh`
  }
  return `https://map.naver.com/p/search/${encodeURIComponent(p.name + ' ' + (p.roadAddress || p.address))}`
}

function directionsUrl(p: Place): string {
  if (p.placeId && p.lng !== null && p.lat !== null) {
    return `https://map.naver.com/p/directions/-/-/${p.lng},${p.lat},${encodeURIComponent(p.name)},${p.placeId},PLACE_POI/-/transit`
  }
  if (p.lng !== null && p.lat !== null) {
    return `https://map.naver.com/p/directions/-/-/${p.lng},${p.lat},${encodeURIComponent(p.name)},,ADDRESS_POI/-/transit`
  }
  return `https://map.naver.com/p/search/${encodeURIComponent(p.name + ' ' + (p.roadAddress || p.address))}`
}

function genericSearchUrl(e: Experience): string {
  const q = `${props.region ? props.region + ' ' : ''}${e.search_keywords?.[0] || e.name}`
  return `https://map.naver.com/p/search/${encodeURIComponent(q)}`
}
</script>

<style scoped>
.result-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  gap: 12px;
}
.result-name { font-size: 20px; font-weight: 600; color: #1a1a1a; }
.result-summary { font-size: 14px; color: #666; margin-top: 4px; }

.result-section { margin-bottom: 2rem; }
.result-section-title { font-size: 16px; font-weight: 600; color: #1a1a1a; margin-bottom: 12px; }

.strength-card {
  background: #FAEEDA;
  border: 1px solid #FAC775;
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 8px;
}
.strength-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.strength-icon { font-size: 18px; }
.strength-name { font-size: 14px; font-weight: 600; color: #633806; }
.strength-desc { font-size: 13px; color: #854F0B; line-height: 1.6; }

.exp-card {
  background: #fff;
  border: 1px solid #E8E8E4;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}
.exp-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 6px; }
.exp-name { font-size: 16px; font-weight: 600; color: #1a1a1a; }
.exp-badge {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 99px;
  white-space: nowrap;
  border: 1px solid transparent;
}

.cat-art       { background: #FCE4D9; color: #B8521A; border-color: #F4B58F; }
.cat-science   { background: #DDE9FA; color: #1F4F94; border-color: #A8C2EA; }
.cat-sports    { background: #FDE3E5; color: #B11C2A; border-color: #F2A8AD; }
.cat-social    { background: #FFF0CC; color: #92651A; border-color: #F2D58A; }
.cat-nature    { background: #E1F5EE; color: #0F6E56; border-color: #A0DBC4; }
.cat-tech      { background: #E5E0F7; color: #4B2F95; border-color: #BBA9E3; }
.cat-music     { background: #FFDCEC; color: #A03174; border-color: #F2A6CE; }
.cat-literature{ background: #F1ECE2; color: #6E5A2B; border-color: #D5C49B; }
.cat-default   { background: #EAF3DE; color: #3B6D11; border-color: #C0DD97; }

.exp-desc { font-size: 13px; color: #555; line-height: 1.6; margin-bottom: 8px; }
.exp-meta { display: flex; gap: 12px; margin-bottom: 8px; }
.exp-age { font-size: 12px; color: #888; }
.exp-why { font-size: 12px; color: #0F6E56; background: #E1F5EE; border-radius: 6px; padding: 8px 10px; line-height: 1.5; }

.places-section {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed #E8E8E4;
}
.places-title {
  font-size: 12px;
  font-weight: 600;
  color: #555;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.places-count {
  font-size: 11px;
  font-weight: 500;
  color: #888;
  background: #F0EFEB;
  padding: 2px 8px;
  border-radius: 99px;
}

.place-card {
  background: #FAFAF8;
  border: 1px solid #ECEBE6;
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 8px;
}
.place-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 6px; }
.place-name { font-size: 14px; font-weight: 600; color: #1a1a1a; line-height: 1.4; }
.place-cat { font-size: 10px; color: #888; white-space: nowrap; padding-top: 2px; }
.place-addr { font-size: 12px; color: #666; margin-bottom: 4px; line-height: 1.5; }
.place-tel { font-size: 12px; color: #666; margin-bottom: 8px; }

.place-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 8px;
}
.place-btn {
  flex: 1;
  min-width: 80px;
  text-align: center;
  font-size: 12px;
  padding: 7px 10px;
  border-radius: 8px;
  background: #fff;
  color: #555;
  border: 1px solid #E0DFD9;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}
.place-btn:hover { border-color: #BA7517; color: #854F0B; background: #FFF9F0; }
.place-btn.primary {
  background: #03C75A;
  color: #fff;
  border-color: #03C75A;
}
.place-btn.primary:hover { background: #02A94D; border-color: #02A94D; color: #fff; }

.more-btn {
  width: 100%;
  font-size: 12px;
  color: #666;
  background: #fff;
  border: 1px dashed #D8D7D1;
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  margin-top: 4px;
  font-family: inherit;
}
.more-btn:hover { background: #FAFAF8; color: #854F0B; border-color: #BA7517; }

.places-empty {
  margin-top: 14px;
  padding: 12px;
  background: #FAFAF8;
  border: 1px dashed #E0DFD9;
  border-radius: 10px;
  text-align: center;
}
.places-empty-text { font-size: 12px; color: #888; margin-bottom: 8px; line-height: 1.5; }
</style>
