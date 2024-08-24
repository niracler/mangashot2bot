import { InlineQueryResultPhoto } from "grammy/types"
import { Env } from ".."
import { Context } from "grammy"

// Handle inline queries and respond with relevant results
export async function handleInlineQuery(ctx: Context, env: Env) {
    if (!ctx.inlineQuery) return
    const { query, offset: rawOffset, id: inlineQueryId } = ctx.inlineQuery
    const offset = rawOffset ? parseInt(rawOffset, 10) : 0

    // Fetch manga list from the database and KV store
    const mangaList = await fetchMangaList(env)
    const searchResults = getSearchResults(query, mangaList, offset)

    // Answer the inline query with the results
    await ctx.answerInlineQuery(searchResults, {
        next_offset: calculateNextOffset(offset).toString()
    })
}

// Fetch manga list from the database and KV store
async function fetchMangaList(env: Env): Promise<InlineQueryResultPhoto[]> {
    const dbResults = await env.DB.prepare('SELECT * FROM mangashot ORDER BY updated_at DESC').all()

    // Map database results to the appropriate structure
    const dbMangaList: InlineQueryResultPhoto[] = dbResults.results.map((entry: any) => ({
        type: 'photo',
        id: entry.id as string,
        title: entry.title as string,
        caption: entry.caption as string,
        photo_url: entry.photo_url as string,
        thumbnail_url: entry.thumbnail_url as string
    }))

    // Combine with KV store results
    const kvMangaList = (await env.MANGA_LIST.get<InlineQueryResultPhoto[]>('mangaList', 'json')) || []
    return dbMangaList.concat(kvMangaList)
}

function getSearchResults(query: string, mangaEntries: InlineQueryResultPhoto[], offset: number) {
    return mangaEntries
        .filter(entry => (entry.title || "").toLowerCase().includes(query.toLowerCase()))
        .slice(offset, offset + 10)
}

function calculateNextOffset(currentOffset: number): number {
    return currentOffset + 10
}