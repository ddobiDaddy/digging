export default defineNuxtConfig({
  compatibilityDate: '2026-05-26',
  devtools: { enabled: false },
  runtimeConfig: {
    useAi: process.env.USE_AI === 'true',
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    ollamaModel: process.env.OLLAMA_MODEL || 'llama3.2',
    naverClientId: process.env.NAVER_CLIENT_ID || '',
    naverClientSecret: process.env.NAVER_CLIENT_SECRET || '',
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
