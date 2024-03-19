/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

// Imports database
import { getDatabase, getCollection } from "./db.js"

// This file should be self explanatory. If anything, read the JSDoc of each function.
// The code is written simple enough and MongoDB functions are self descriptive.

/**
 * Used to store a timezone for a specific user.
 * @param {string} userId - The discord.js ID of the user
 * @param {string} timezoneName - Timezone abbreviation of the user. (UTC, GMT, CET, PDT, etc..)
 * @returns {boolean} - True if the storig was successful. Currently only returned value unless error is thrown.
 */
export async function storeTimezone(userId: string, timezoneName: string): Promise<boolean> {
    const db = await getDatabase('brianbot')
    const users = await getCollection('users', db)

    await users.updateOne(
        { id: userId },
        { $set: { tz: timezoneName } },
        { upsert: true }
    )

    return true
}

/**
 * Used to fetch the timezone for a specific user.
 * @param {string} userId - The discord.js ID of the user
 * @returns {string} - The timezone abbreviation of the user. (UTC, GMT, CET, PDT, etc..)
 */
export async function getTimezone(userId: string): Promise<string | null> {
    const db = await getDatabase('brianbot')
    const users = await getCollection('users', db)

    const doc = await users.findOne({ id: userId })
    if (!doc) return null

    return doc.tz
}
