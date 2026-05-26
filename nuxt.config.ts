export default defineNuxtConfig({
  compatibilityDate: '2026-05-26',
  devtools: { enabled: false },
  nitro: {
    storage: {
      // 공유 결과를 익명으로 저장하는 KV.
      // 로컬: 프로젝트 루트의 .data/shares/ 폴더에 파일로 저장.
      // 배포 시 환경에 따라 다른 드라이버로 교체 가능 (Cloudflare KV, Vercel KV 등).
      shares: {
        driver: 'fs',
        base: './.data/shares',
      },
    },
  },
  runtimeConfig: {
    useAi: process.env.USE_AI === 'true',
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    ollamaModel: process.env.OLLAMA_MODEL || 'llama3.2',
    naverClientId: process.env.NAVER_CLIENT_ID || '',
    naverClientSecret: process.env.NAVER_CLIENT_SECRET || '',
    public: {
      // 공유 링크/메타태그에 사용할 사이트의 기본 URL.
      // 배포 후 .env에 SITE_URL=https://digging.app 같은 식으로 지정.
      siteUrl: process.env.SITE_URL || 'http://localhost:3000',
    },
  },
  app: {
    head: {
      title: '디깅 - 아이의 가능성을 발견하는 곳',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '아이의 성향을 파고들어 잘 맞는 체험을 찾아드려요' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600&display=swap' }
      ]
    }
  }
})
