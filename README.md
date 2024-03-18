# Brian Bot
**Brian Bot** is a multi-purpose discord bot that currently offers features with Timezones and Currency.

# Slash Commands
There's only one slash command
```
/settimezone <tz>
```
This is used to set your own timezone with the bot. Without it the bot will assume your timezone is UTC. But with it, it will change your default fallback from UTC to whatever you have set.

For example, your timezone is PDT, if so, use
```
/settimezone tz:pdt
```
This will change your timezone fallback to PDT rather than UTC.

Do also note that when your country switches between daylight saving times, you will need to adapt manually. I would do it automatically, but not all countries follow daylight saving, which means it would be inaccurate.

# How to use
Brian Bot currently offers 2 features. Timezone conversion and Currency conversion.<br>
Do note that the bot needs to be able to read message history as well as being able to send messages, as well as ability for users to use slash commands. This is all that it needs.<br>
Do also note that you need to surround your inputs with `-` in order to actually use the bots chat features. In doing so, assuming it matches the regex, it will proceed with performing the following features.

## Timezone Conversion
Supports multiple message layouts.
Here's a few examples
```
18:30 UTC
6:30 AM PDT
6:30PM PDT
6:12AM UTC-8:00
4:30 UTC+9
6:16
12AM
12AM CET
```

There is however a few bugs and side effects with the regex. Due to the default fallback being UTC (Unless you changed it with `/settimezone`) and some middle parts being optional, the following is also valid
```
18:30 +1
```

This would be the same as (or if you used `/settimezone`, replace UTC with whatever you have set)
```
18:30 UTC+1
```

Do also note that letters are case-insensitive.
This means `12:30AM PDT` is the same as `12:30am pdt`.

When using the bot to convert timezones, as stated before, surround the input with `-`. If you do this, and it matches the regex, the bot will reply with the following:

Let's say you type `Currently it's -2:30pm cet- and I quit work at -4:45pm cet-`, then the bot would respond (assuming your local timezone is UTC and today's date is March 16th 2024) with `Currently it's 16 March 2024 13:30 and I quit work at 16 March 2024 15:45`.

## Currency Conversion
There's only really a single layout this supports.
```
<value> <currency abbreviation>
```
This means the following is valid
```
100 SEK
1 BTC
12 GBP
1000 USD
15 NOK
```
However note that some people may write spaces in their numbers, thus these are also valid
```
1 000 SEK
20 000 GBP
1 0 0 0 0 NOK
```
Last one is silly, but it does work.

Do note that just like the last feature, letters are case-insensitive.
This means `12 SEK` is the same as `12 sek`.

The converted values are currently only shows in euros (€).<br>
If the value is less than 1€, it will show 8 decimals, otherwise only 2 decimals.

When using the bot to convert currencies, as stated before, surround the input with `-`. If you do this, and it matches the regex, the bot will reply with the following:

Let's say you type `I bought my food for -49 sek-`, assuming one EUR is 11.28 SEK, the bot will reply with `I bought my food for 4.34€`, and if you type `I saw a sweet going for -10 sek-` the bot will reply with `I saw a sweet going for 0.88590740€`.

## Extra
Note that both the Timezone and Currency conversion feature can be used in the same message.

# Setup
This will go through the steps necessary to host and run Brian Bot.<br>
Of course, you need some manual setup to use this bot. First off, make sure you got a discord application with a bot account on it.<br>
This will be the user used to run this discord bot under.

Next, proceed to follow the instructions below to set up the rest of the bots needs.

## `.env` Config.
Create a file called `.env` next to the `package.json` file, and include this content:
```
BTOKEN="<insert bot auth token here>"
BCLIENT_ID="<insert client/app id here>"
```

You will also need to have a MongoDB server running somewhere. This setup assumes that authentication is required for your MongoDB server.<br>
For the `.env` file, add these two lines
```
DB_ADDRESS="<insert mongodb server address here>"
DB_PORT="<insert mongodb server port here>"
```
Additionally the MongoDB usage I use comes from a few different projects of mine and generates a config key from a hash algorithm I made.<br>
Brian Bot uses the database name `brianbot` so create a user under sand database, then add this to your `.env` file.
```
DB_USER_AQWSBEQL="<insert mongodb user here>"
DB_PASS_AQWSBEQL="<insert mongodb user password here>"
```

## `timezones.csv` File
Additionally, you will need a file called `timezones.csv`. Due to potential licensing issues I have not included this in here.<br>
Instead you need to naviate to [List of time zone abbreviations on Wikipedia](https://en.wikipedia.org/wiki/List_of_time_zone_abbreviations) and download that table as a csv file.<br>
Wikipedia don't have their own way of offering that to you, but simply googling something like `wikipedia table to csv` should give you some ways of doing that.

## Running the bot
Once you got all that, you can now run the bot using the following command
```sh
$ node --loader ts-node/esm src/app.ts
```

Do note that you may be missing installed modules, if so, make sure to install them using
```sh
$ npm i
```

## Running the bot as a service
Optionally you can also run it as a service. I use Linux for my hosting needs so I will show how to run it using systemd.
```ini
[Unit]
Description=BrianBot
After=network.target
[Service]
WorkingDirectory=/path/to/brianbot
User=username
Group=username
Type=simple
ExecStart=/path/to/node --loader ts-node/esm /path/to/brianbot/src/app.js
TimeoutSec=30
RestartSec=15s
Restart=always
KillSignal=SIGINT
[Install]
WantedBy=multi-user.target
```
On Ubuntu, save this to ``/etc/systemd/system/brianbot.service``, then run the following to reload the daemon configs:
```sh
# You will need to reload daemon configs every time you edit a .service file
$ sudo systemctl daemon-reload
```

## Managing the bot service
To manage the bot state, run one of the following
```sh
# Start/Stop/Restart the bot
$ sudo systemctl <start|stop|restart> brianbot

# Enable/Disable auto start on system boot
$ sudo systemctl <enable|disable> brianbot

# Check the status of the bot
$ sudo systemctl status brianbot
```

## Manage bot service logs
To check the logs, run one of the following
```sh
# Check the logs from the moment the bot service was created.
# Note: You can skip to the latest by pressing G (capital g).
$ sudo journalctl -u brianbot

# Tail the logs, automatically polling for the latest output.
$ sudo journalctl -u brianbot -f
```

# License
Brian Bot is licensed under the license [MPL License](https://github.com/Kirdow/BrianBot/blob/master/LICENSE)
