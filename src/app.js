/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { GatewayIntentBits, Partials } from 'discord.js'
import { createBot } from './dbot.js'
import { promises as fs } from 'fs'

const regex = /\-(\d\d?):?(\d\d)? ?([AaPp][Mm])? ?([A-Za-z]+)?([\+\-]\d\d?:?(\d\d)?)?\-/g
const plusRegex = /^([\+\-])(\d\d?)(\:\d\d)?$/

async function generateMap() {
    try {
        const data = await fs.readFile("timezones.csv", { encoding: 'utf8' })
        const lines = data.split(/\r?\n/)
        
        const result = {}
        for (const line of lines) {
            try {
                const split = line.split(',')
                if (split.length !== 3) continue;
                const abbr = split[0]
                if (abbr.toUpperCase() !== abbr) continue;

                const fullOffset = split[2]

                // Dual zone
                if (fullOffset.includes('/')) continue

                const positive = fullOffset[3] === '+'
                const hourStr = fullOffset[4] + fullOffset[5]
                const minuteStr = fullOffset.includes(':') ? fullOffset[7] + fullOffset[8] : '00'

                const hour = Number(hourStr)
                const minute = Number(minuteStr)

                const minutes = (hour * 60 + minute) * (positive * 2 - 1)
                result[abbr] = {
                    abbr,
                    positive,
                    hour,
                    minute,
                    minutes,
                    raw: fullOffset
                }
            } catch (error) {
                console.error(`Failed to parse entry for line [${line}]:`, error)
            }
        }
        return result
    } catch (error) {
        console.error("Error reading timezone map:", error)
        return {}
    }
}

const timezoneMap = await generateMap()

async function messageCreate(client, message) {
    if (message.author.bot) return;
    const content = message.content
    const newContent = content.replace(regex, (p, hour, minute, dual, zone, plus) => {
        dual = dual ? dual.toUpperCase() : undefined
        zone = zone ? zone.toUpperCase() : 'UTC'
        minute ??= '00'
        plus ??= '+0:00'

        if (dual !== undefined && hour === '12') {
            hour = '00'
        }
        const date = new Date()
        date.setUTCHours(Number(hour))
        date.setUTCMinutes(Number(minute))
        if (dual === 'PM') {
            date.setUTCHours(date.getUTCHours() + 12)
        }

        const obj = timezoneMap[zone]
        if (!obj) return p;
        date.setUTCMinutes(date.getUTCMinutes() - obj.minutes)
        
        if (plus) {
            const matches = plus.match(plusRegex)
            if (matches) {
                const positive = matches[1] === '+'
                const hourPlus = Number(matches[2])
                const minutePlus = Number(matches[3] ? matches[3].substring(1) : '00')
                const timePlus = (positive * 2 - 1) * (hourPlus * 60 + minutePlus)
                date.setUTCMinutes(date.getUTCMinutes() - timePlus)
            }
        }

        const time = `<t:${Math.trunc(date.getTime() / 1000)}:f>`
        return time
    })
    
    if (newContent === content) return;


    await message.reply(newContent)
}

const bbot = createBot({
    authPrefix: 'B',
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
    partials: [Partials.Message, Partials.Channel],
    ready: client => {
        console.log(`Logged in as ${client.user.tag}`)
    },
    eventsCallback: client => {
        client.on('messageCreate', async (...args) => await messageCreate(client, ...args))
    }
})