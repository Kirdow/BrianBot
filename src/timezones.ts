/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { promises as fs } from 'fs'

// Timezone offset entry
export interface ITimezoneEntry {
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
export async function generateMap(): Promise<Record<string, ITimezoneEntry>> {
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

