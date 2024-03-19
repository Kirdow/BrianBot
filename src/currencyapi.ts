/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

// Currency map for [name] => course
export type CurrencyCourseMap = Record<string, number>

// Api response interface containing the actual data
interface ICurrencyApiResponseData {
    [key: string]: CurrencyCourseMap
}

// Api response interface containing the date
interface ICurrencyApiResponseDate {
    date: string
}

// Main api response type using both above interfaces
type ICurrencyApiResponse = ICurrencyApiResponseData & ICurrencyApiResponseDate

// Cache instance
interface ICache {
    // The expirty date
    date: Date
    
    // The cached data
    data: CurrencyCourseMap
}

// Fetch the current up to date currency data for [endpoint].
// This is an API provided by https://github.com/fawazahmed0 for free.
async function getCurrencyJson(endpoint: string): Promise<ICurrencyApiResponse> {
    const response = await fetch(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${endpoint}.json`)
    return await response.json()
}

// This is what actually renews the cache, there is more to it than just fetching and store it.
// Since this contains [endpoint] -> x but we need x -> [endpoint], we inverse it by doing 1.0 / z
// where z is the function of turning [endpoint] into x.
async function renewCache(endpoint: string): Promise<CurrencyCourseMap> {
    const data: CurrencyCourseMap = (await getCurrencyJson(endpoint))?.[endpoint]
    if (!data) return {}

    const resultData: CurrencyCourseMap = {}
    for (const [curr, value] of Object.entries(data)) {
        // Also if the value is too low, we just discard it. I don't want to deal with NaN values from zero divisions
        if (Math.abs(value) <= 0.00000005) continue;
        resultData[curr] = 1.0 / value
    }

    return resultData
}

// Simple function to check if the date is outdated.
// I don't know why I really made this, I expected the function to be more
// complex but it turned out rather simple in the end.
function isOutdated(date: Date): boolean {
    const now = new Date()
    return now.getTime() >= date.getTime()
}

// The variable storing the current cache
let cache: Record<string, ICache> = {}

// This retrieves the cached currency data to the caller.
// If the cache is outdated or it doesn't exist, it fetches the current
// data and then caches it until the next 7am time in UTC.
export async function getCurrencyData(endpoint: string): Promise<CurrencyCourseMap> {
    if (cache === null) {
        throw new Error("Cache instance not set")
    }

    const cacheData = cache[endpoint]
    if (cacheData !== null && !isOutdated(cacheData.date)) {
        return cacheData.data
    }

    const data = await renewCache(endpoint)
    const date = new Date()
    const hour = date.getUTCHours()
    const days = hour < 7 ? 0 : 1
    date.setUTCDate(date.getUTCDate() + days)
    date.setUTCHours(7)
    date.setUTCMinutes(0)

    cache[endpoint] = {
        data,
        date
    }

    return data
}
