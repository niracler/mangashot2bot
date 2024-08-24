import telegramifyMarkdown from "telegramify-markdown"
import { Context } from "grammy"
import { Env } from ".."

// Handle incoming messages, checking for documents and text
export async function handleDocument(ctx: Context, env: Env) {
    const document = ctx.message?.document

    if (!document || !document.thumbnail?.file_id || !document.mime_type) {
        await ctx.reply('哎呀~ 不好意思，我只接受文件类型的消息呢~(⁄ ⁄•⁄ω⁄•⁄ ⁄)ﾉ')
        return
    }

    const { file_id, thumbnail, mime_type, file_unique_id } = document
    const thumbnailId = thumbnail.file_id
    const caption = ctx.message.caption

    if (!caption || !caption.includes('#')) {
        await ctx.reply('请给我一个标题哦~ 格式要是："标题 #标签" 呐~ (๑•̀ᴗ-๑)')
        return
    }

    const title = extractTitle(caption)

    try {
        // Fetch URLs for the document and its thumbnail
        const [fileUrl, thumbnailUrl] = await Promise.all([
            getTelegramFileUrl(file_id, env.TELEGRAM_BOT_TOKEN),
            getTelegramFileUrl(thumbnailId, env.TELEGRAM_BOT_TOKEN)
        ])

        // Download file and thumbnail
        const [fileData, thumbnailData] = await Promise.all([
            fetch(fileUrl).then(res => res.arrayBuffer()),
            fetch(thumbnailUrl).then(res => res.arrayBuffer())
        ])

        // Generate storage URLs
        const { r2FileUrl, r2ThumbnailUrl } = generateStorageUrls(file_unique_id, mime_type)

        // Upload to the R2 bucket
        await Promise.all([
            env.MY_BUCKET.put(`${file_unique_id}.${getFileExtension(mime_type)}`, fileData),
            env.MY_BUCKET.put(`${file_unique_id}.th.${getFileExtension(mime_type)}`, thumbnailData)
        ])

        // Upsert photo data in the database
        const isUpdate = await upsertPhotoInDatabase(env.DB, file_unique_id, title, r2FileUrl, r2ThumbnailUrl, caption)
        if (isUpdate) {
            await ctx.reply(telegramifyMarkdown(`嘻嘻~ 已更新图片信息啦！(≧▽≦) ID: \`${file_unique_id}\``),
                { parse_mode: "MarkdownV2" })
        } else {
            await ctx.reply(telegramifyMarkdown(`哇~ 已上传新图片哦！(✿◠‿◠) ID: \`${file_unique_id}\``),
                { parse_mode: "MarkdownV2" })
        }

    } catch (error) {
        console.error('处理文件时出错：', error)
        await ctx.reply(`哎哟~ 处理文件时出错啦：${error} (\´；д；\`)`)
    }

    return new Response('Document processed', { status: 200 })
}

// Function to extract title from caption
function extractTitle(caption: string) {
    return caption.split('#')[0].trim()
}

// Function to generate storage URLs
function generateStorageUrls(fileUniqueId: string, mimeType: string) {
    const suffix = getFileExtension(mimeType)
    const prefix = `https://mangashot.niracler.com/${fileUniqueId}`
    return {
        r2FileUrl: `${prefix}.${suffix}`,
        r2ThumbnailUrl: `${prefix}.th.${suffix}`
    }
}

// Helper function to get file extension from MIME type
function getFileExtension(mimeType: string) {
    return mimeType.split('/')[1]
}

// Helper function to get file URLs from Telegram
async function getTelegramFileUrl(fileId: string, botSecret: string): Promise<string> {
    const fileResponse = await fetch(`https://api.telegram.org/bot${botSecret}/getFile?file_id=${fileId}`)

    if (!fileResponse.ok) {
        throw new Error(`Telegram API getFile.responded with status ${fileResponse.status} (⁄ ⁄•⁄ω⁄•⁄ ⁄)`)
    }

    const fileData = await fileResponse.json() as { ok: boolean, result: { file_path: string } }
    const filePath = fileData.result.file_path

    return `https://api.telegram.org/file/bot${botSecret}/${filePath}`
}

// Upsert photo information in the database
async function upsertPhotoInDatabase(db: D1Database, fileUniqueId: string, title: string, photoUrl: string, thumbnailUrl: string, caption: string) {
    const existingPhoto = await db.prepare('SELECT * FROM mangashot WHERE id = ?').bind(fileUniqueId).all()

    const query = existingPhoto.results.length > 0
        ? 'UPDATE mangashot SET title = ?, photo_url = ?, thumbnail_url = ?, caption = ? WHERE id = ?'
        : `INSERT INTO mangashot (title, photo_url, thumbnail_url, caption, id) VALUES (?, ?, ?, ?, ?)`

    await db.prepare(query)
        .bind(title, photoUrl, thumbnailUrl, caption, fileUniqueId)
        .run()

    return existingPhoto.results.length > 0
}