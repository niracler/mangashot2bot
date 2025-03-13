import { InlineQueryResultPhoto } from "grammy/types"
import { Env } from ".."
import { Context } from "grammy"

// Handle inline queries and respond with relevant results
export async function handleInlineQuery(ctx: Context, env: Env) {
    if (!ctx.inlineQuery) return
    const { query, offset: rawOffset } = ctx.inlineQuery
    const offset = rawOffset ? parseInt(rawOffset, 10) : 0

    const mangaList = await fetchMangaList(env)
    const searchResults = getSearchResults(query, mangaList, offset)

    // Answer the inline query with the results
    await ctx.answerInlineQuery(searchResults, {
        next_offset: calculateNextOffset(offset).toString()
    })
}

async function fetchMangaList(env: Env): Promise<InlineQueryResultPhoto[]> {
    const dbResults = await env.DB.prepare('SELECT * FROM mangashot ORDER BY updated_at DESC').all()

    return dbResults.results.map((entry: any) => ({
        type: 'photo',
        id: entry.id as string,
        title: entry.title as string,
        caption: entry.caption as string,
        photo_url: entry.photo_url as string,
        thumbnail_url: entry.thumbnail_url as string
    }))
}

function getSearchResults(query: string, mangaEntries: InlineQueryResultPhoto[], offset: number) {
    return mangaEntries
        .filter(entry => (entry.title || "").toLowerCase().includes(query.toLowerCase()))
        .slice(offset, offset + 10)
}

function calculateNextOffset(currentOffset: number): number {
    return currentOffset + 10
}