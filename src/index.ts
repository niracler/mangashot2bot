import { Bot } from 'grammy'
import { InlineQueryResultArticle, Update } from 'grammy/types'

export interface Env {
	TELEGRAM_BOT_TOKEN: string
	MANGA_LIST: KVNamespace
}

// 用于响应 Telegram webhook 请求的入口函数
export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {

		// 只接受POST请求
		if (request.method !== 'POST') {
			return new Response('Expecting POST request', { status: 405 }) 
		}

		// 检查是否是 inline 模式, 并记录日志
		const update: Update = await request.json() 
		if (!update.inline_query) {
			return new Response('Update processed', { status: 200 })
		}
		console.log('Received inline query:', JSON.stringify(update))

		// 解析请求参数
		const { query, offset: rawOffset, id: inlineQueryId } = update.inline_query
		const offset = rawOffset ? parseInt(rawOffset, 10) : 0

		// 初始化 Bot
		const bot = new Bot(env.TELEGRAM_BOT_TOKEN)

		// 从 KV 存储中获取漫画列表，并根据查询获取搜索结果
		const mangaList = (await env.MANGA_LIST.get<InlineQueryResultArticle[]>('mangaList', 'json')) || []
		const searchResults = getSearchResults(query, mangaList, offset)

		// 返回Inline查询结果给用户
		await bot.api.answerInlineQuery(inlineQueryId, searchResults, {
			next_offset: calculateNextOffset(offset).toString()
		})

		return new Response('Update processed', { status: 200 })
	}
}

// 根据用户查询过滤和分页漫画列表
function getSearchResults(query: string, mangaEntries: InlineQueryResultArticle[], offset: number) {
	return mangaEntries
		.filter(entry => entry.title.toLowerCase().includes(query.toLowerCase())) // 忽略大小写进行比较
		.slice(offset, offset + 10) // 返回下一个分页结果
}

// 计算下一页的offset
function calculateNextOffset(currentOffset: number): number {
	return currentOffset + 10
}