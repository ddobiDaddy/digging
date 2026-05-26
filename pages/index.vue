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

      <!-- 한 줄 입력 (메인) -->
      <div class="card card-highlight">
        <label class="section-label">한 줄로 알려주세요</label>
        <textarea
          v-model="quickInput"
          class="textarea quick-input"
          rows="3"
          placeholder="예: 7살 아들인데 레고를 4시간씩 만들고, 서울 마포구에 살아요"
          @input="onQuickInputChange"
        />
        <div v-if="parsePreview.length" class="parse-preview">
          <span class="parse-preview-label">인식됨</span>
          <span v-for="tag in parsePreview" :key="tag" class="parse-tag">{{ tag }}</span>
        </div>
        <button type="button" class="apply-btn" @click="applyQuickInput">
          입력 내용 폼에 반영하기
        </button>
      </div>

      <button type="button" class="toggle-advanced" @click="showAdvanced = !showAdvanced">
        {{ showAdvanced ? '▲ 간단히 보기' : '▼ 나이·동네·성향 직접 고르기' }}
      </button>

      <div v-show="showAdvanced" class="advanced-block">
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

        <button
          type="button"
          class="location-btn"
          :disabled="locating"
          @click="detectLocation"
        >
          <span v-if="locating">위치 확인 중...</span>
          <span v-else>📍 내 위치로 동네 찾기</span>
        </button>
        <p v-if="locationMessage" class="location-msg">{{ locationMessage }}</p>

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
      </div>

      <p v-if="error" class="error-msg">{{ error }}</p>

      <button class="submit-btn" :disabled="loading" @click="analyze">
        <span v-if="loading">분석 중...</span>
        <span v-else>✨ 체험 추천 받기</span>
      </button>
    </div>

    <!-- RESULT -->
    <div v-if="step === 'result' && result" class="container">
      <!-- 공유 / 다시 분석 액션 바 -->
      <div class="action-bar">
        <button class="action-btn share-btn" :disabled="sharing" @click="shareResult">
          <span v-if="sharing">공유 준비 중...</span>
          <span v-else>📤 친구한테 공유</span>
        </button>
        <button class="action-btn" @click="reset">↻ 다시 분석</button>
      </div>

      <p v-if="shareMessage" class="share-msg">{{ shareMessage }}</p>

      <ResultView :result="result" :age="form.age" :region="combinedRegion" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { SIDO_LIST, DISTRICTS, NEIGHBORHOODS, type Sido } from '~/utils/regions'
import { parseNaturalInput, mapGeocodeToRegion } from '~/utils/parse-input'

interface AnalyzeResult {
  summary: string
  strengths: { name: string; desc: string; icon: string }[]
  experiences: any[]
}

const config = useRuntimeConfig()
const step = ref<'form' | 'result'>('form')
const loading = ref(false)
const error = ref('')
const result = ref<AnalyzeResult | null>(null)
const sharing = ref(false)
const shareMessage = ref('')
const shareId = ref('')

const quickInput = ref('')
const parsePreview = ref<string[]>([])
const showAdvanced = ref(false)
const locating = ref(false)
const locationMessage = ref('')

let quickParseTimer: ReturnType<typeof setTimeout> | null = null

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

function onQuickInputChange() {
  if (quickParseTimer) clearTimeout(quickParseTimer)
  quickParseTimer = setTimeout(() => {
    const parsed = parseNaturalInput(quickInput.value)
    parsePreview.value = parsed.recognized
  }, 400)
}

function applyParsedToForm(parsed: ReturnType<typeof parseNaturalInput>) {
  if (parsed.age) form.age = parsed.age
  form.regionSido = parsed.regionSido
  form.regionDistrict = parsed.regionDistrict
  form.regionNeighborhood = parsed.regionNeighborhood
  if (parsed.traits.length) form.traits = [...parsed.traits]
  if (parsed.memo) form.memo = parsed.memo
  parsePreview.value = parsed.recognized
}

function applyQuickInput() {
  const text = quickInput.value.trim()
  if (!text) {
    error.value = '한 줄이라도 입력해주세요.'
    return
  }
  error.value = ''
  applyParsedToForm(parseNaturalInput(text))
  if (!showAdvanced.value && parsePreview.value.length) {
    showAdvanced.value = true
  }
}

async function detectLocation() {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    locationMessage.value = '이 브라우저에서는 위치 기능을 쓸 수 없어요.'
    return
  }
  locating.value = true
  locationMessage.value = ''
  error.value = ''

  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      })
    })

    const geo = await $fetch<{
      sido: string
      sigungu: string
      dong: string
      displayName: string
    }>('/api/reverse-geocode', {
      query: { lat: pos.coords.latitude, lng: pos.coords.longitude },
    })

    const mapped = mapGeocodeToRegion({
      sido: geo.sido,
      sigungu: geo.sigungu,
      dong: geo.dong,
    })

    form.regionSido = mapped.regionSido
    form.regionDistrict = mapped.regionDistrict
    form.regionNeighborhood = mapped.regionNeighborhood
    parsePreview.value = mapped.recognized
    locationMessage.value = combinedRegion.value
      ? `✓ ${combinedRegion.value} 으로 설정했어요`
      : '✓ 위치를 찾았어요. 구/동을 직접 선택해주세요.'
    showAdvanced.value = true
  } catch (e: any) {
    if (e?.code === 1) {
      locationMessage.value = '위치 권한이 필요해요. 브라우저 설정에서 허용해주세요.'
    } else {
      locationMessage.value = e?.data?.message || e?.message || '위치를 가져오지 못했어요.'
    }
  } finally {
    locating.value = false
  }
}

async function analyze() {
  // 한 줄만 입력했을 때도 분석 가능하도록 먼저 반영
  if (quickInput.value.trim()) {
    applyParsedToForm(parseNaturalInput(quickInput.value.trim()))
  }

  if (form.traits.length === 0 && !form.memo.trim()) {
    error.value = '한 줄로 설명하거나, 성향·메모를 입력해주세요.'
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
    shareMessage.value = ''
    shareId.value = ''
    step.value = 'result'
    // 분석 직후 백그라운드로 공유 ID 발급 → 공유 버튼이 즉시 동작
    saveShareLink(data)
  } catch (e: any) {
    error.value = '분석 중 오류가 발생했어요. 다시 시도해주세요.'
  } finally {
    loading.value = false
  }
}

function reset() {
  step.value = 'form'
  result.value = null
  shareId.value = ''
  shareMessage.value = ''
  quickInput.value = ''
  parsePreview.value = []
  locationMessage.value = ''
  showAdvanced.value = false
}

function sharePageUrl(id: string): string {
  const base = (config.public.siteUrl as string).replace(/\/$/, '')
  return `${base}/r/${id}`
}

async function saveShareLink(data: AnalyzeResult) {
  try {
    const res = await $fetch<{ id: string }>('/api/share', {
      method: 'POST',
      body: {
        age: form.age,
        region: combinedRegion.value,
        result: data,
      },
    })
    shareId.value = res.id
  } catch {
    // 공유 저장 실패해도 결과 화면은 그대로 표시
  }
}

async function shareResult() {
  if (!result.value) return
  sharing.value = true
  shareMessage.value = ''
  try {
    if (!shareId.value) {
      await saveShareLink(result.value)
    }
    if (!shareId.value) {
      shareMessage.value = '공유 링크를 만들지 못했어요. 잠시 후 다시 시도해주세요.'
      return
    }

    const url = sharePageUrl(shareId.value)
    const title = `디깅 - ${form.age}세 아이의 체험 추천`
    const text = result.value.summary

    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({ title, text, url })
      shareMessage.value = ''
    } else if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url)
      shareMessage.value = '✓ 링크가 복사됐어요. 카톡에 붙여넣어 공유해보세요!'
    } else {
      shareMessage.value = url
    }
  } catch (e: any) {
    if (e?.name === 'AbortError') return
    shareMessage.value = '공유에 실패했어요. 다시 시도해주세요.'
  } finally {
    sharing.value = false
  }
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

/* ---------- Quick input ---------- */
.card-highlight {
  border-color: #FAC775;
  background: linear-gradient(180deg, #FFFCF5 0%, #fff 100%);
}
.quick-input {
  min-height: 72px;
  font-size: 15px;
  line-height: 1.65;
}
.parse-preview {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin: 10px 0;
}
.parse-preview-label {
  font-size: 11px;
  color: #888;
  font-weight: 600;
}
.parse-tag {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 99px;
  background: #E1F5EE;
  color: #0F6E56;
  border: 1px solid #A0DBC4;
}
.apply-btn {
  width: 100%;
  padding: 10px;
  border: 1px dashed #BA7517;
  border-radius: 8px;
  background: #FFF9F0;
  color: #854F0B;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
}
.apply-btn:hover { background: #FAEEDA; }

.toggle-advanced {
  width: 100%;
  padding: 10px;
  margin-bottom: 1rem;
  border: none;
  background: transparent;
  color: #888;
  font-size: 13px;
  cursor: pointer;
  font-family: inherit;
  text-align: center;
}
.toggle-advanced:hover { color: #854F0B; }

.advanced-block { margin-bottom: 0; }

.location-btn {
  width: 100%;
  padding: 11px;
  margin-bottom: 12px;
  border-radius: 10px;
  border: 1px solid #03C75A;
  background: #fff;
  color: #028A42;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}
.location-btn:hover:not(:disabled) {
  background: #E8F9EF;
}
.location-btn:disabled { opacity: 0.6; cursor: wait; }
.location-msg {
  font-size: 12px;
  color: #0F6E56;
  margin: -6px 0 12px;
  line-height: 1.5;
}

/* ---------- Share action bar ---------- */
.action-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 1rem;
}
.action-btn {
  flex: 1;
  padding: 11px 14px;
  border-radius: 10px;
  border: 1px solid #E8E8E4;
  background: #fff;
  font-size: 14px;
  font-weight: 500;
  color: #555;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}
.action-btn:hover:not(:disabled) {
  border-color: #BA7517;
  color: #854F0B;
  background: #FFF9F0;
}
.action-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.share-btn {
  flex: 1.4;
  background: #BA7517;
  border-color: #BA7517;
  color: #FAEEDA;
}
.share-btn:hover:not(:disabled) {
  background: #854F0B;
  border-color: #854F0B;
  color: #FAEEDA;
}
.share-msg {
  font-size: 13px;
  color: #0F6E56;
  background: #E1F5EE;
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 1rem;
  line-height: 1.5;
  word-break: break-all;
}
</style>
