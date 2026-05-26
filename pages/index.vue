<template>
  <div class="app">
    <!-- FORM -->
    <div v-if="step === 'form'" class="container">
      <header class="header">
        <div class="logo-wrap">
          <!-- 디깅 로고: 돋보기 + 별 (찾아서 발견한다) -->
          <svg class="logo-mark" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <!-- 돋보기 손잡이 -->
            <path d="M44.5 44.5 L57 57" stroke="#BA7517" stroke-width="6" stroke-linecap="round"/>
            <!-- 돋보기 원 -->
            <circle cx="27" cy="27" r="19" stroke="#BA7517" stroke-width="5" fill="#FFF6E5"/>
            <!-- 안의 별 (발견한 가능성) -->
            <path
              d="M27 14.5 L30.1 23 L39 23.6 L32 29.2 L34.4 38 L27 33 L19.6 38 L22 29.2 L15 23.6 L23.9 23 Z"
              fill="#EF9F27"
              stroke="#854F0B"
              stroke-width="1.2"
              stroke-linejoin="round"
            />
            <!-- 반짝임 효과 -->
            <circle cx="42" cy="14" r="1.8" fill="#EF9F27"/>
            <circle cx="14" cy="42" r="1.4" fill="#EF9F27"/>
            <circle cx="48" cy="33" r="1.2" fill="#FAC775"/>
          </svg>
          <h1 class="logo-text">디깅</h1>
        </div>
        <p class="tagline">아이의 재미 안에서 관심사와 가능성을 찾아요</p>
      </header>

      <div class="card">
        <label class="section-label">
          나이 <span class="optional">(선택 - <strong class="age-now">{{ form.age }}세</strong>)</span>
        </label>
        <div class="age-chips">
          <button
            v-for="n in ageOptions"
            :key="n"
            class="age-chip"
            :class="{ active: form.age === n }"
            @click="form.age = n"
          >
            {{ n }}
          </button>
        </div>
      </div>

      <div class="card">
        <label class="section-label">
          우리 동네 <span class="optional">(선택 - 입력하면 가까운 실제 장소를 추천해요)</span>
        </label>

        <div class="region-label">시/도</div>
        <div class="region-chips">
          <button
            v-for="r in sidoList"
            :key="r"
            class="region-chip"
            :class="{ active: form.regionSido === r }"
            @click="selectSido(r)"
          >
            {{ r }}
          </button>
        </div>

        <div v-if="districtsOfSido.length > 0">
          <div class="region-label">{{ form.regionSido }}의 구/시/군</div>
          <div class="region-chips district-chips">
            <button
              v-for="d in districtsOfSido"
              :key="d"
              class="region-chip district-chip"
              :class="{ active: form.regionDistrict === d }"
              @click="selectDistrict(d)"
            >
              {{ d }}
            </button>
          </div>
        </div>

        <div v-if="neighborhoodsOfDistrict.length > 0">
          <div class="region-label">{{ form.regionDistrict }}의 동</div>
          <div class="region-chips neighborhood-chips">
            <button
              v-for="n in neighborhoodsOfDistrict"
              :key="n"
              class="region-chip neighborhood-chip"
              :class="{ active: form.regionNeighborhood === n }"
              @click="selectNeighborhood(n)"
            >
              {{ n }}
            </button>
          </div>
        </div>

        <div v-if="combinedRegion" class="region-preview">📍 {{ combinedRegion }}</div>
      </div>

      <div class="card">
        <label class="section-label">평소 어떤 모습인가요? (해당하는 것 모두 선택)</label>
        <div class="tags-grid">
          <button
            v-for="tag in traitOptions"
            :key="tag.label"
            class="tag"
            :class="{ active: form.traits.includes(tag.value) }"
            @click="toggleTrait(tag.value)"
          >
            {{ tag.label }}
          </button>
        </div>
      </div>

      <div class="card">
        <label class="section-label">더 자세히 알려주세요 <span class="optional">(선택)</span></label>
        <textarea
          v-model="form.memo"
          class="textarea"
          placeholder="예: 레고를 4시간씩 혼자 조립하고, 설명서 없이도 잘 만들어요."
        />
      </div>

      <p v-if="error" class="error-msg">{{ error }}</p>

      <button class="submit-btn" :disabled="loading" @click="analyze">
        <span v-if="loading">분석 중...</span>
        <span v-else>✨ 체험 추천 받기</span>
      </button>
    </div>

    <!-- RESULT -->
    <div v-if="step === 'result'" class="container">
      <header class="result-header">
        <div>
          <h1 class="result-name">{{ form.age }}세 아이의 디깅 결과</h1>
          <p class="result-summary">{{ result.summary }}</p>
        </div>
        <button class="reset-btn" @click="reset">← 다시 분석</button>
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

          <!-- 실제 장소 카드들 -->
          <div v-if="e.places && e.places.length > 0" class="places-section">
            <div class="places-title">
              📍 {{ combinedRegion ? `${combinedRegion} 추천 장소` : '추천 장소' }}
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

          <!-- 장소가 없을 때 -->
          <div v-else class="places-empty">
            <p class="places-empty-text">
              {{ combinedRegion ? `'${combinedRegion}' 근처에서 검색된 장소가 없어요.` : '실제 장소를 보려면 폼에서 동네를 선택해주세요.' }}
            </p>
            <a class="place-btn" :href="genericSearchUrl(e)" target="_blank" rel="noopener">
              🔍 네이버 지도에서 직접 검색
            </a>
          </div>
        </div>
      </section>
    </div>
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

const step = ref<'form' | 'result'>('form')
const loading = ref(false)
const error = ref('')
const result = ref<AnalyzeResult | null>(null)
const expanded = reactive<Record<string, boolean>>({})

import { SIDO_LIST, DISTRICTS, NEIGHBORHOODS, type Sido } from '~/utils/regions'

const form = reactive({
  age: 7,
  regionSido: '' as Sido | '',
  regionDistrict: '',
  regionNeighborhood: '',
  traits: [] as string[],
  memo: '',
})

const sidoList = SIDO_LIST
const ageOptions = Array.from({ length: 13 }, (_, i) => i + 3) // 3~15

const districtsOfSido = computed<string[]>(() => {
  if (!form.regionSido) return []
  return DISTRICTS[form.regionSido as Sido] || []
})

const neighborhoodsOfDistrict = computed<string[]>(() => {
  if (!form.regionSido || !form.regionDistrict) return []
  return NEIGHBORHOODS[form.regionSido]?.[form.regionDistrict] || []
})

const combinedRegion = computed(() => {
  return [form.regionSido, form.regionDistrict, form.regionNeighborhood]
    .filter(Boolean)
    .join(' ')
    .trim()
})

const traitOptions = [
  { label: '만들기를 좋아해요', value: '혼자 조용히 뭔가 만들길 좋아함' },
  { label: '사교적이에요', value: '친구들과 어울리길 좋아하고 리더십이 있음' },
  { label: '자연을 좋아해요', value: '동물이나 식물에 관심이 많음' },
  { label: '책을 좋아해요', value: '책이나 이야기에 빠져듦' },
  { label: '숫자·규칙에 관심있어요', value: '숫자나 규칙에 관심이 많음' },
  { label: '그림 그리길 좋아해요', value: '그림 그리기나 색칠을 즐김' },
  { label: '활동적이에요', value: '몸을 움직이는 활동을 좋아함' },
  { label: '음악을 좋아해요', value: '음악이나 노래에 반응이 빠름' },
  { label: '질문이 많아요', value: '왜 그런지 질문을 많이 함' },
  { label: '도전을 즐겨요', value: '새로운 것에 거부감이 적고 도전적임' },
  { label: '공감 능력이 있어요', value: '감정이 풍부하고 공감을 잘함' },
  { label: '한 가지에 집중해요', value: '집중력이 강하고 한 가지에 몰두함' },
]

function selectSido(r: Sido) {
  // 같은 칩을 다시 누르면 해제 + 하위 선택 모두 초기화
  if (form.regionSido === r) {
    form.regionSido = ''
  } else {
    form.regionSido = r
  }
  form.regionDistrict = ''
  form.regionNeighborhood = ''
}

function selectDistrict(d: string) {
  form.regionDistrict = form.regionDistrict === d ? '' : d
  form.regionNeighborhood = ''
}

function selectNeighborhood(n: string) {
  form.regionNeighborhood = form.regionNeighborhood === n ? '' : n
}

function toggleTrait(value: string) {
  const idx = form.traits.indexOf(value)
  if (idx > -1) form.traits.splice(idx, 1)
  else form.traits.push(value)
}

async function analyze() {
  if (form.traits.length === 0 && !form.memo) {
    error.value = '성향을 하나 이상 선택하거나 설명을 입력해주세요.'
    return
  }
  error.value = ''
  loading.value = true
  try {
    const data = await $fetch<AnalyzeResult>('/api/analyze', {
      method: 'POST',
      body: {
        age: form.age,
        region: combinedRegion.value,
        traits: form.traits,
        memo: form.memo,
      },
    })
    result.value = data
    Object.keys(expanded).forEach((k) => delete expanded[k])
    step.value = 'result'
  } catch (e: any) {
    error.value = '분석 중 오류가 발생했어요. 다시 시도해주세요.'
  } finally {
    loading.value = false
  }
}

function reset() {
  step.value = 'form'
  result.value = null
}

function categoryClass(cat: string): string {
  const map: Record<string, string> = {
    예술: 'art',
    과학: 'science',
    스포츠: 'sports',
    사회: 'social',
    자연: 'nature',
    기술: 'tech',
    음악: 'music',
    문학: 'literature',
  }
  return map[cat] || 'default'
}

// --- 네이버 지도 URL 조립 ---
// 모든 외부 링크는 무조건 네이버 지도(map.naver.com) 안으로만 보냅니다.
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
  const q = `${combinedRegion.value ? combinedRegion.value + ' ' : ''}${e.search_keywords?.[0] || e.name}`
  return `https://map.naver.com/p/search/${encodeURIComponent(q)}`
}
</script>

<style scoped>
* { box-sizing: border-box; }

.app {
  min-height: 100vh;
  background: #FAFAF8;
  font-family: 'Noto Sans KR', sans-serif;
  padding: 2rem 1rem;
}

.container {
  max-width: 640px;
  margin: 0 auto;
}

/* ---------- Header (logo center) ---------- */
.header {
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.logo-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.logo-mark {
  width: 76px;
  height: 76px;
  filter: drop-shadow(0 4px 12px rgba(186, 117, 23, 0.18));
}
.logo-text {
  font-size: 32px;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: -0.5px;
  margin: 0;
}
.tagline {
  font-size: 14px;
  color: #666;
  margin-top: 6px;
}

.card {
  background: #fff;
  border: 1px solid #E8E8E4;
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1rem;
}

.section-label {
  display: block;
  font-size: 13px;
  color: #555;
  font-weight: 500;
  margin-bottom: 10px;
}

.optional { font-weight: 400; color: #aaa; }

.text-input {
  width: 100%;
  border: 1px solid #E8E8E4;
  border-radius: 8px;
  padding: 9px 12px;
  font-size: 15px;
  font-family: inherit;
  color: #1a1a1a;
  outline: none;
}
.text-input:focus { border-color: #EF9F27; }

/* ---------- Age chips ---------- */
.age-now { color: #854F0B; font-weight: 600; }
.age-chips {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(48px, 1fr));
  gap: 6px;
}
.age-chip {
  padding: 10px 0;
  border-radius: 8px;
  border: 1px solid #E8E8E4;
  background: #fff;
  font-size: 14px;
  font-weight: 500;
  color: #555;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
  font-variant-numeric: tabular-nums;
}
.age-chip:hover { border-color: #EF9F27; color: #854F0B; }
.age-chip.active {
  background: #BA7517;
  border-color: #BA7517;
  color: #FFF6E5;
  font-weight: 600;
}

/* ---------- Region chips ---------- */
.region-label {
  font-size: 11px;
  color: #888;
  font-weight: 500;
  margin: 8px 0 6px;
  letter-spacing: 0.2px;
}
.region-label:first-child { margin-top: 0; }

.region-chips {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  gap: 6px;
  margin-bottom: 10px;
}
.region-chip {
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #E8E8E4;
  background: #fff;
  font-size: 13px;
  color: #555;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.region-chip:hover { border-color: #EF9F27; color: #854F0B; }
.region-chip.active {
  background: #BA7517;
  border-color: #BA7517;
  color: #FFF6E5;
  font-weight: 500;
}

/* 구/시/군 칩은 약간 작고 부드럽게 */
.district-chips {
  background: #FAFAF8;
  border: 1px solid #ECEBE6;
  border-radius: 10px;
  padding: 8px;
  margin-bottom: 10px;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
}
.district-chip {
  padding: 6px 8px;
  font-size: 12px;
}
.district-chip.active {
  background: #EF9F27;
  border-color: #EF9F27;
  color: #fff;
}

/* 동 칩은 더 작고 조밀하게, 더 약한 톤으로 */
.neighborhood-chips {
  background: #FFFDF8;
  border: 1px solid #F4E8CC;
  border-radius: 10px;
  padding: 8px;
  margin-bottom: 10px;
  max-height: 240px;
  overflow-y: auto;
  grid-template-columns: repeat(auto-fill, minmax(64px, 1fr));
}
.neighborhood-chip {
  padding: 5px 6px;
  font-size: 11px;
  color: #777;
}
.neighborhood-chip.active {
  background: #FAC775;
  border-color: #FAC775;
  color: #633806;
  font-weight: 600;
}
.region-preview {
  margin-top: 10px;
  font-size: 12px;
  color: #854F0B;
  background: #FFF9F0;
  border: 1px dashed #FAC775;
  border-radius: 8px;
  padding: 8px 10px;
}

/* ---------- Traits ---------- */
.tags-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.tag {
  padding: 6px 14px;
  border-radius: 99px;
  border: 1px solid #E8E8E4;
  font-size: 13px;
  cursor: pointer;
  color: #666;
  background: #fff;
  font-family: inherit;
  transition: all 0.15s;
}
.tag:hover { border-color: #EF9F27; color: #854F0B; }
.tag.active { background: #FAEEDA; border-color: #EF9F27; color: #854F0B; font-weight: 500; }

.textarea {
  width: 100%;
  border: 1px solid #E8E8E4;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
  font-family: inherit;
  color: #1a1a1a;
  resize: vertical;
  min-height: 90px;
  line-height: 1.6;
  outline: none;
}
.textarea:focus { border-color: #EF9F27; }
.textarea::placeholder { color: #bbb; }

.error-msg { font-size: 13px; color: #c0392b; margin-bottom: 8px; }

.submit-btn {
  width: 100%;
  padding: 13px;
  background: #BA7517;
  color: #FAEEDA;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s;
}
.submit-btn:hover:not(:disabled) { background: #854F0B; }
.submit-btn:disabled { background: #ccc; color: #fff; cursor: not-allowed; }

/* ---------- Result ---------- */
.result-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}
.result-name { font-size: 20px; font-weight: 600; color: #1a1a1a; }
.result-summary { font-size: 14px; color: #666; margin-top: 4px; }
.reset-btn {
  font-size: 13px;
  color: #666;
  background: none;
  border: 1px solid #E8E8E4;
  border-radius: 8px;
  padding: 6px 12px;
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
}

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

/* ---------- Experience card ---------- */
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

/* ---------- Places ---------- */
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
