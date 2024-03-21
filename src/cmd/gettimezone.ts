/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

// Lib imports
import { SlashCommandBuilder } from "discord.js";

// Create the command definition for /gettimezone
const gettimezoneCommand = new SlashCommandBuilder()
    .setName('gettimezone')
    .setDescription('Get your timezone')

// Export the command JSON as a default export
export default gettimezoneCommand.toJSON()

