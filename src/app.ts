/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

// Lib imports
import { GatewayIntentBits, Partials, Client, Message, Interaction, ChatInputCommandInteraction } from 'discord.js'
import { promises as fs } from 'fs'

// Internal imports
import { createBot } from './dbot.js'
import { storeTimezone, getTimezone } from './tzdb.js'
import { replaceAsync } from './utils.js'

// Command imports
import SettimezoneCommand from './cmd/settimezone.js'
import { getCurrencyValueString } from './currency.js'

// Regex definitions
const regex = /\-(\d\d?):?(\d\d)? ?([AaPp][Mm])? ?([A-Za-z]+)?([\+\-]\d\d?:?(\d\d)?)?\-/g
const plusRegex = /^([\+\-])(\d\d?)(\:\d\d)?$/
const currencyRegex = /\-([\d ]+) ([A-Za-z]+)\-/g

interface ITimezoneEntry {
    abbr: string;
    positive: boolean;
    hour: number;
    minute: number;
    minutes: number;
    raw: string;
}

// Generate the map of timezones.
// This takes the timezone abbreviations as input and returns an object storing data about the timezone.
// Notable we're mostly after the `minutes` field which stores the total minutes of offset from UTC.
async function generateMap(): Promise<Record<string, ITimezoneEntry>> {
    try {
        const data = await fs.readFile("timezones.csv", { encoding: 'utf8' })
        const lines = data.split(/\r?\n/)
        
        const result: Record<string, ITimezoneEntry> = {}
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

                const minutes = (positive ? 1 : -1) * (hour * 60 + minute)
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

// Generate the map async and store here.
const timezoneMap: Record<string, ITimezoneEntry> = await generateMap()

// Event run when a user send a message in a channel
// where the bot has read access.
async function messageCreate(client: Client, message: Message): Promise<void> {
    if (message.author.bot) return;
    const userTz = await getTimezone(message.author.id) || 'UTC'
    const content = message.content
    let newContent = content.replace(regex, (p, hour, minute, dual, zone, plus) => {
        dual = dual ? dual.toUpperCase() : undefined
        zone = zone ? zone.toUpperCase() : userTz
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
                const timePlus = (positive ? 1 : -1) * (hourPlus * 60 + minutePlus)
                date.setUTCMinutes(date.getUTCMinutes() - timePlus)
            }
        }

        const time = `<t:${Math.trunc(date.getTime() / 1000)}:f>`
        return time
    })

    newContent = await replaceAsync(newContent, currencyRegex, async (p: string, value: string, currency: string) => {
        try {
            const valueStr = value.replace(' ', '')
            const valueNumber = Number(valueStr)
            const eurStr = await getCurrencyValueString(currency, valueNumber)
            return eurStr
        } catch (err) {
            console.error("Failed to convert currency, ", value, ",", currency, ":", err)
            return p
        }
    })
    
    if (newContent === content) return;


    await message.reply(newContent)
}

// Event run when a user starts an interaction (be that a button or slash command).
// This currently only uses slash commands.
async function interactionResponse(baseInteraction: Interaction): Promise<void> {
    if (!baseInteraction.isChatInputCommand()) return
    const interaction: ChatInputCommandInteraction = baseInteraction

    try {
        if (interaction.commandName === 'settimezone') {
            const tz = interaction.options.getString('tz')

            if (!timezoneMap[tz.toUpperCase()]) {
                await interaction.reply({
                    content: 'Invalid timezone',
                    ephemeral: true
                })

                return
            }

            await storeTimezone(interaction.user.id, tz.toUpperCase())
            
            await interaction.reply({
                content: `Your timezone is now set to ${tz.toUpperCase()}`,
                ephemeral: true
            })

            return
        }

        await interaction.reply({
            content: 'Unknown command',
            ephemeral: true
        })
    } catch (error) {
        console.log("Interaction error", error)
    }
}

// Create the actual bot client instance.
// This uses some code I've copied from other projects of mine.
// It's pretty simple but also makes the creation of a bot instance simple as well.
const bbot: Client = createBot({
    authPrefix: 'B',
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
    partials: [Partials.Message, Partials.Channel],
    ready: (client: Client) => {
        console.log(`Logged in as ${client.user.tag}`)
    },
    commands: [
        SettimezoneCommand
    ],
    eventsCallback: (client: Client) => {
        client.on('interactionCreate', interactionResponse)
        client.on('messageCreate', async (...args) => await messageCreate(client, ...args))
    }
})
