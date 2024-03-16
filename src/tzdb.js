/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import {time} from "console"
import { getDatabase, getCollection } from "./db.js"

export async function storeTimezone(userId, timezoneName) {
    const db = await getDatabase('brianbot')
    const users = await getCollection('users', db)

    await users.updateOne(
        { id: userId },
        { $set: { tz: timezoneName } },
        { upsert: true }
    )

    return true
}

export async function getTimezone(userId) {
    const db = await getDatabase('brianbot')
    const users = await getCollection('users', db)

    const doc = await users.findOne({ id: userId })
    if (!doc) return null

    return doc.tz
}
