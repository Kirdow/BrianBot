/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

// Import dotenv since we use it
import 'dotenv/config'

// Lib imports
const fs = await import('fs')
import { REST, Routes, Client, RESTPostAPIChatInputApplicationCommandsJSONBody, GatewayIntentBits, Partials } from 'discord.js'

export interface ICreateBotOptions {
    authPrefix: string
    commands: Array<RESTPostAPIChatInputApplicationCommandsJSONBody>
    intents: Array<GatewayIntentBits>
    partials: Array<Partials>
    ready?: (client: Client) => void
    eventsCallback?: (client: Client) => void
}

// Function used to create a bot client.
// This stems from a private project where I run multiple users for the same bot due to customization.
// Very easy to use, and follows a "single object for every initialization" model. Not an offical term,
// but it describes it well enough tbh.
export function createBot(opts: ICreateBotOptions): Client {
    const token = process.env[`${opts.authPrefix}TOKEN`]
    const clientId = process.env[`${opts.authPrefix}CLIENT_ID`]
    const client = new Client({ intents: opts.intents || [], partials: opts.partials || [], rest: { version: '10' } })
    const registerCommands = (async () => {
        if (opts.commands) {
            try {
                console.log('Started refreshing application (/) commands.')

                await client.rest.put(Routes.applicationCommands(clientId), { body: opts.commands })

                console.log('Successfully reloaded application (/) commands.')
            } catch (error) {
                console.error("(/) Commands Error:\n", error)
            }
        }
    });

    const loggerFilter = (text: string) => {
        text = text.toLowerCase()
        // Heartbeat spam is just wack so I get rid of it.
        // Just my ocd not wanting the systemd logs to simply be heartbeat logs when trying to find bugs.
        if (text.includes('sending a heartbeat')) return true
        if (text.includes('heartbeat acknowledged')) return true

        return false
    };

    let name = 'Unknown'
    client.on('error', err => {
        console.error(`Discord Error [${name}]:`, err)
    })
    client.on('warn', wrn => {
        console.warn(`Discord Warning [${name}]:`, wrn)
    })
    client.on('debug', dbg => {
        if (loggerFilter(dbg)) return;
        console.debug(`Discord Debug [${name}]:`, dbg)
    })
    client.on('ready', () => {
        name = client.user.username
        if (opts.ready) {
            try {
                opts.ready(client)
            } catch (error) {
                console.error("Discord Bot Ready Error:\n", error)
            }
        }
    })

    if (opts.eventsCallback) {
        try {
            opts.eventsCallback(client)
        } catch (error) {
            console.log(error)
        }
    }

    client.login(token)

    // Calling without await IS intentional
    registerCommands()

    return client
}
