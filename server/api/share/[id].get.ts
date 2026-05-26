import { isValidShareId } from '../../utils/share-id'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id || !isValidShareId(id)) {
    throw createError({ statusCode: 400, message: '잘못된 공유 링크입니다.' })
  }

  const storage = useStorage('shares')
  const stored = await storage.getItem<any>(id)

  if (!stored) {
    throw createError({ statusCode: 404, message: '공유 결과를 찾을 수 없어요.' })
  }

  return stored
})
