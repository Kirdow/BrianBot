/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { getCurrencyData } from './currencyapi.js'

// Fetches the factor for turning `name` into `EUR`.
// For example is 10 XYZ was 5 EUR, getCurrency('XYZ') would return 0.5.
export async function getCurrency(name: string, source: string = 'eur'): Promise<number | null> {
    const currencyName = name.toLowerCase()
    const sourceName = source.toLowerCase()

    const data = await getCurrencyData(sourceName)

    const course = data[currencyName.toLowerCase()]
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
export async function getCurrencyValueString(name: string, value: number): Promise<string> {
    const course = await getCurrency(name)
    if (course === null) return `[Unknown Currency]`

    const eurValue = value * course
    const str = eurValue < 1.0 ? eurValue.toFixed(8) : eurValue.toFixed(2)
    return str + "€"
}
