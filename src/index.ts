import { Bot, Context, webhookCallback } from 'grammy'
import { handleInlineQuery } from './handlers/inlineQuery'
import { handleDocument } from './handlers/document'
import { handleDelete } from './handlers/delete'

// Environment interface to hold required environment variables
export interface Env {
	TELEGRAM_BOT_TOKEN: string
	TELEGRAM_BOT_INFO: string
	MANGA_LIST: KVNamespace
	MY_BUCKET: R2Bucket
	DB: D1Database
}

// Main export function to handle incoming requests
export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const bot = new Bot(env.TELEGRAM_BOT_TOKEN, { botInfo: JSON.parse(env.TELEGRAM_BOT_INFO) })

		bot.command("start", async (ctx: Context) => {
			await ctx.reply("嗨嗨~ 世界，你好呀！(｡♥‿♥｡)")
		})
		bot.command("delete", (ctx: Context) => handleDelete(ctx, env))

		bot.on("inline_query", (ctx: Context) => handleInlineQuery(ctx, env))
		bot.on("message:document", (ctx: Context) => handleDocument(ctx, env))

		return webhookCallback(bot, "cloudflare-mod")(request)
	}
}