/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

// Uses dotenv so this line HAS to be first!
(await import('dotenv')).config()

// Rest of imports below
import { MongoClient, Db, Collection } from "mongodb";

// Some maps for caching
const clients: Record<string, MongoClient> = {}
const keys: Record<string, string> = {}

// Generates a key based on the database name.
// This is based on a different project of mine, but with less bugs.
// This comes from my other projects may use more databases in the same,
// project thus having a unique key for each database done easily,
// is a necessity. It's similar to hashing but it's really just botched.
function getKey(name: string): string {
    name = name.toUpperCase()
    if (keys[name]) return keys[name]

    const base = "KEYSBOAT"
    const keyLen = base.length
    const result: Array<number> = []
    const iters: Array<number> = []
    let len = 0
    const push = (x: string) => {
        if (len < keyLen) {
            result.push(x.charCodeAt(0) - 65)
            iters.push(1)
            ++len
            return
        } 

        result[len % keyLen] += x.charCodeAt(0) - 65
        iters[len % keyLen]++
        ++len
    }

    const maxLen = Math.max(keyLen * 16, name.length)

    for (let i = 0; i < keyLen; i++) {
        push(base.charAt(i))
    }

    for (let i = 0; i < maxLen; i++) {
        const index = i % name.length
        push(name.charAt(index))
    }

    let str = ''
    for (let i = 0; i < keyLen; i++) {
        str += String.fromCharCode(((result[i] % 26) | 0) + 65)
    }

    return keys[name] = str.toUpperCase()
}

// Return client if exist or create it and cache it.
// This uses the key generated with `getKey` just above.
// The key is then added as `DB_USER_<key here>` and `DB_PASS_<key here>` in the `.env` file.
// I'm try to make sure the user and pass never gets logged, nor exit the scope of the if statement,
// further than the need of creating MongoClient.
async function connectMongoClient(db: string): Promise<MongoClient> {
    const key = getKey(db)

    let client = clients[db]

    if (!client) {
        let user = process.env['DB_USER_' + key]
        let pass = process.env['DB_PASS_' + key]

        if (!user || !pass) {
            console.warn(`Missing MongoDB Key \`${key}\` for db \`${db}\``)
            user = 'missing'
            pass = 'credentials'
        }

        const address = process.env['DB_ADDRESS']
        const port = process.env['DB_PORT']

        const uri = `mongodb://${user}:${pass}@${address}:${port}/${db}`
        client = new MongoClient(uri)
        await client.connect()
    }

    return clients[db] = client
}

// Get a database instance based on the name of the database.
// Calls the above function which uses the key and auth based on the database name.
export async function getDatabase(name: string): Promise<Db> {
    const client = await connectMongoClient(name)
    return client.db(name)
}

// Gets the collection needed. Database taken as parameter due to the way we could
// be using multiple databases per project and each of them have their own auth.
// Otherwise you'd probably cache the database internally, which we don't.
export async function getCollection(name: string, db: Db): Promise<Collection> {
    const collections = await db.listCollections({}, { nameOnly: true }).toArray()
    const collectionNames = collections.map(c => c.name)

    if (!collectionNames.includes(name)) {
        await db.createCollection(name)
    }

    return db.collection(name)
}
