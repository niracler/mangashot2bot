import { Context } from "grammy"
import telegramifyMarkdown from "telegramify-markdown"
import { Env } from ".."

export async function handleDelete(ctx: Context, env: Env) {
    const message = ctx.message
    const fileUniqueId = message?.reply_to_message?.document?.file_unique_id || message?.text?.split(' ')[1]
    if (!fileUniqueId) {
        await ctx.reply('哎呀~ 请提供要删除的文件 ID， 或者回复要删除的文件哦~(⁄ ⁄•⁄ω⁄•⁄ ⁄)ﾉ')
        return
    }

    try {
        // Delete the photo data from the database
        await deletePhotoFromDatabase(env.DB, fileUniqueId)

        await ctx.reply(telegramifyMarkdown(`嘻嘻~ 已删除图片信息啦！(≧▽≦) ID: \`${fileUniqueId}\``, 'escape'),
            { parse_mode: "MarkdownV2" })

    } catch (error) {
        console.error('删除文件时出错：', error)
        await ctx.reply(`哎哟~ 删除文件时出错啦：${error} (\´；д；\`)`)
    }
}

async function deletePhotoFromDatabase(db: D1Database, fileUniqueId: string) {
    await db.prepare('DELETE FROM mangashot WHERE id = ?').bind(fileUniqueId).run()
}