/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

(await import('dotenv')).config()
import { MongoClient } from "mongodb";

const clients = {}
const keys = {}

function getKey(name) {
    name = name.toUpperCase()
    if (keys[name]) return keys[name]

    const base = "KEYSBOAT"
    const keyLen = base.length
    const result = []
    const iters = []
    let len = 0
    const push = (x) => {
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

    const key = keys[name] = str.toUpperCase()

    return key
}

async function connectMongoClient(db) {
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

export async function getDatabase(name) {
    const client = await connectMongoClient(name)
    return client.db(name)
}

export async function getCollection(name, db) {
    const collections = await db.listCollections({}, { nameOnly: true }).toArray()
    const collectionNames = collections.map(c => c.name)

    if (!collectionNames.includes(name)) {
        await db.createCollection(name)
    }

    return db.collection(name)
}
