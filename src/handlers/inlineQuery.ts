import { InlineQueryResultPhoto } from "grammy/types"
import { Env } from ".."
import { Context } from "grammy"

// Cache key name
const MANGA_LIST_CACHE_KEY = 'manga_list_cache'
// Cache expiration time (10 minutes, in milliseconds)
const CACHE_TTL = 10 * 60 * 1000
// Number of results per page
const RESULTS_PER_PAGE = 50

// Interface for cached data
interface CacheData {
    timestamp: number;
    data: InlineQueryResultPhoto[];
}

// Handle inline queries and respond with relevant results
export async function handleInlineQuery(ctx: Context, env: Env) {
    if (!ctx.inlineQuery) return
    const { query, offset: rawOffset } = ctx.inlineQuery
    const offset = rawOffset ? parseInt(rawOffset, 10) : 0

    const mangaList = await fetchMangaList(env)
    const filteredResults = mangaList.filter(entry => (entry.title || "").toLowerCase().includes(query.toLowerCase()))
    const searchResults = filteredResults.slice(offset, offset + RESULTS_PER_PAGE)

    // Answer the inline query with the results
    await ctx.answerInlineQuery(searchResults, {
        next_offset: calculateNextOffset(offset, filteredResults.length).toString()
    })
}

async function fetchMangaList(env: Env): Promise<InlineQueryResultPhoto[]> {
    // Try to get data from KV cache
    const cachedData = await env.MANGA_LIST.get<CacheData>(MANGA_LIST_CACHE_KEY, 'json')

    // If cache exists and hasn't expired, return cached data
    if (cachedData && cachedData.timestamp && (Date.now() - cachedData.timestamp < CACHE_TTL)) {
        console.log('Using cached manga list data')
        return cachedData.data
    }

    // Cache doesn't exist or has expired, fetch data from database
    console.log('Fetching manga list data from database')
    const dbResults = await env.DB.prepare('SELECT * FROM mangashot ORDER BY updated_at DESC').all()

    const mangaList: InlineQueryResultPhoto[] = dbResults.results.map((entry: any) => ({
        type: 'photo' as const,
        id: entry.id as string,
        title: entry.title as string,
        caption: entry.caption as string,
        photo_url: entry.photo_url as string,
        thumbnail_url: entry.thumbnail_url as string
    }))

    // Store data in KV cache
    const cacheData: CacheData = {
        timestamp: Date.now(),
        data: mangaList
    }

    // Use put method to write data to KV (no need to set expiration time, we check it in code)
    await env.MANGA_LIST.put(MANGA_LIST_CACHE_KEY, JSON.stringify(cacheData))

    return mangaList
}

function getSearchResults(query: string, mangaEntries: InlineQueryResultPhoto[], offset: number) {
    return mangaEntries
        .filter(entry => (entry.title || "").toLowerCase().includes(query.toLowerCase()))
        .slice(offset, offset + RESULTS_PER_PAGE)
}

function calculateNextOffset(currentOffset: number, totalResults: number): string {
    // Check if there are more results
    if (currentOffset + RESULTS_PER_PAGE >= totalResults) {
        // No more results, return empty string
        return "";
    }
    // More results available, return offset for the next page
    return (currentOffset + RESULTS_PER_PAGE).toString();
}