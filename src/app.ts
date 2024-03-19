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
import { generateMap, ITimezoneEntry } from './timezones.js'
import { getCurrencyValueString } from './currency.js'

// Command imports
import SettimezoneCommand from './cmd/settimezone.js'

// Regex definitions
const regex = /\-(\d\d?):?(\d\d)? ?([AaPp][Mm])? ?([A-Za-z]+)?([\+\-]\d\d?:?(\d\d)?)?\-/g
const plusRegex = /^([\+\-])(\d\d?)(\:\d\d)?$/
const currencyRegex = /\-([\d ]+) ([A-Za-z]+)\-/g

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
            const valueStr = value.replaceAll(' ', '')
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
            const tz = interaction.options.getString('tz')!

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
        console.log(`Logged in as ${client.user!.tag}`)
    },
    commands: [
        SettimezoneCommand
    ],
    eventsCallback: (client: Client) => {
        client.on('interactionCreate', interactionResponse)
        client.on('messageCreate', async (...args) => await messageCreate(client, ...args))
    }
})
