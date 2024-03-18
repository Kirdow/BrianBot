// Fetch the current up to date currency data for EUR.
// This is an API provided by https://github.com/fawazahmed0 for free.
async function getCurrencyJson() {
    const url = "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/eur.json"

    const response = await fetch(url)
    return await response.json()
}

let cache = null
// This is what actually renews the cache, there is more to it than just fetching and store it.
// Since this contains EUR -> x but we need x -> EUR, we inverse it by doing 1.0 / z
// where z is the function of turning EUR into x.
async function renewCache() {
    const data = (await getCurrencyJson())?.eur
    if (!data) return {}

    const resultData = {}
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
function isOutdated(date) {
    const now = new Date()
    return now.getTime() >= date.getTime()
}

// This retrieves the cached currency data to the caller.
// If the cache is outdated or it doesn't exist, it fetches the current
// data and then caches it until the next 7am time in UTC.
async function getCache() {
    if (cache != null && !isOutdated(cache.date))
        return cache.data

    const data = await renewCache()
    const date = new Date()
    const hour = date.getUTCHours()
    const days = hour < 7 ? 0 : 1
    date.setUTCDate(date.getUTCDate() + days)
    date.setUTCHours(7)
    date.setUTCMinutes(0)

    cache = {
        data,
        date
    }

    return data
}

// Fetches the factor for turning `name` into `EUR`.
// For example is 10 XYZ was 5 EUR, getCurrency('XYZ') would return 0.5.
export async function getCurrency(name) {
    const data = await getCache()

    const course = data[name.toLowerCase()]
    if (!course) {
        console.warn(`Invalid currency name: ${name}`)
        return null
    }

    return course
}

// Fetches the factor for turning `name` into `EUR` (see above function),
// then returns a string to be used with the bot depending on the resulting value.
// The decimals depend on the value in EUR. If it's less than 1€ you use 8 decimals,
// otherwise you use 2 decimals.
export async function getCurrencyValueString(name, value) {
    const course = await getCurrency(name)

    const eurValue = value * course
    const str = eurValue < 1.0 ? eurValue.toFixed(8) : eurValue.toFixed(2)
    return str + "€"
}
