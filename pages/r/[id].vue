<template>
  <div class="app">
    <div class="container">
      <header class="header">
        <NuxtLink to="/" class="logo-wrap">
          <svg class="logo-mark" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M44.5 44.5 L57 57" stroke="#BA7517" stroke-width="6" stroke-linecap="round"/>
            <circle cx="27" cy="27" r="19" stroke="#BA7517" stroke-width="5" fill="#FFF6E5"/>
            <path
              d="M27 14.5 L30.1 23 L39 23.6 L32 29.2 L34.4 38 L27 33 L19.6 38 L22 29.2 L15 23.6 L23.9 23 Z"
              fill="#EF9F27"
              stroke="#854F0B"
              stroke-width="1.2"
              stroke-linejoin="round"
            />
            <circle cx="42" cy="14" r="1.8" fill="#EF9F27"/>
            <circle cx="14" cy="42" r="1.4" fill="#EF9F27"/>
          </svg>
          <span class="logo-text">디깅</span>
        </NuxtLink>
        <p class="tagline">친구가 공유한 분석 결과예요</p>
      </header>

      <div v-if="pending" class="state-box">불러오는 중...</div>
      <div v-else-if="loadError" class="state-box error">
        <p>{{ loadError }}</p>
        <NuxtLink to="/" class="cta-btn">나도 분석해보기</NuxtLink>
      </div>
      <template v-else-if="data">
        <div class="cta-banner">
          <p class="cta-text">우리 아이도 맞는 체험을 찾아볼까요?</p>
          <NuxtLink to="/" class="cta-btn primary">✨ 나도 분석해보기</NuxtLink>
        </div>
        <ResultView
          :result="data.result"
          :age="data.age"
          :region="data.region"
        />
        <div class="cta-bottom">
          <NuxtLink to="/" class="cta-btn primary">✨ 나도 분석해보기</NuxtLink>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const config = useRuntimeConfig()
const id = computed(() => String(route.params.id || ''))

interface StoredShare {
  age: number
  region: string
  result: {
    summary: string
    strengths: { name: string; desc: string; icon: string }[]
    experiences: any[]
  }
}

const loadError = ref('')

const { data, pending } = await useAsyncData(
  () => `share-${id.value}`,
  async () => {
    loadError.value = ''
    try {
      return await $fetch<StoredShare>(`/api/share/${id.value}`)
    } catch (e: any) {
      loadError.value = e?.data?.message || e?.message || '공유 결과를 찾을 수 없어요.'
      return null
    }
  },
  { watch: [id] },
)

const pageTitle = computed(() =>
  data.value ? `디깅 - ${data.value.age}세 아이의 체험 추천` : '디깅 - 공유 결과',
)
const pageDesc = computed(() => data.value?.result?.summary || '아이의 재미 안에서 관심사와 가능성을 찾아요')
const pageUrl = computed(() => {
  const base = (config.public.siteUrl as string).replace(/\/$/, '')
  return `${base}/r/${id.value}`
})

useSeoMeta({
  title: pageTitle,
  description: pageDesc,
  ogTitle: pageTitle,
  ogDescription: pageDesc,
  ogUrl: pageUrl,
  ogType: 'website',
  twitterCard: 'summary_large_image',
})
</script>

<style scoped>
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
.header {
  margin-bottom: 1.5rem;
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
  text-decoration: none;
}
.logo-mark { width: 56px; height: 56px; }
.logo-text {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
}
.tagline { font-size: 13px; color: #888; margin-top: 4px; }

.state-box {
  text-align: center;
  padding: 2rem;
  color: #666;
  font-size: 14px;
}
.state-box.error { color: #c0392b; }

.cta-banner {
  background: linear-gradient(135deg, #FFF9F0 0%, #FAEEDA 100%);
  border: 1px solid #FAC775;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 1.25rem;
  text-align: center;
}
.cta-text {
  font-size: 14px;
  color: #633806;
  margin-bottom: 12px;
  font-weight: 500;
}
.cta-bottom {
  margin-top: 2rem;
  text-align: center;
}
.cta-btn {
  display: inline-block;
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  text-decoration: none;
  border: 1px solid #E8E8E4;
  color: #555;
  background: #fff;
  font-family: inherit;
}
.cta-btn.primary {
  background: #BA7517;
  border-color: #BA7517;
  color: #FAEEDA;
}
.cta-btn.primary:hover {
  background: #854F0B;
  border-color: #854F0B;
}
</style>
