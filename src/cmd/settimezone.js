/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { SlashCommandBuilder } from "discord.js";

const settimezoneCommand = new SlashCommandBuilder()
    .setName('settimezone')
    .setDescription('Set your timezone')
    .addStringOption((option) =>
        option.setName('tz').setDescription('Your timezone abbreviation').setRequired(true)
    )

export default settimezoneCommand.toJSON()
