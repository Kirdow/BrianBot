# Brian Bot
**Brian Bot** is a bot that currently allows you to easily mention Timezones in discord chats.

# How to use
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

There is however a few bugs and side effects with the regex. Due to the default fallback being UTC and some middle parts being optional, the following is also valid
```
18:30 +1
```

This would be the same as
```
18:30 UTC+1
```

Do also note that letters are case-insensitive.
This means `12:30AM PDT` is the same as `12:30am pdt`.

Do note that you need to surround your inputs with `-` in order to actually use the bot. In doing so, assuming it matches the regex, the bot will respond with the following:

Let's say you type `Currently it's -2:30pm cet- and I quit work at -4:45pm cet-`, then the bot would respond (assuming your local timezone is UTC and today's date is March 16th 2024) with `Currently it's 16 March 2024 13:30 and I quit work at 16 March 2024 15:45`.

Do also note that the bot needs to be able to read message history as well as being able to send messages. This is all that it needs.

# Setup
Of course, you need some manual setup to use this bot. First off, make sure you got a discord application with a bot account on it.<br>
Create a file called `.env` next to the `package.json` file, and include this content:
```
BTOKEN="<insert bot auth token here>"
BCLIENT_ID="<insert client/app id here>"
```

Additionally, you will need another file called `timezones.csv`. Due to potential licensing issues I have not included this in here.<br>
Instead you need to naviate to [List of time zone abbreviations on Wikipedia](https://en.wikipedia.org/wiki/List_of_time_zone_abbreviations) and download that table as a csv file.<br>
Wikipedia don't have their own way of offering that to you, but simply googling something like `wikipedia table to csv` should give you some ways of doing that.

Once you got all that, you can now run the bot using the following command
```sh
$ node src/app.js
```

Do note that you may be missing installed modules, if so, make sure to install them using
```sh
$ npm i
```

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
ExecStart=/path/to/node /path/to/brianbot/src/app.js
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

To manage the bot state, run one of the following
```sh
# Start/Stop/Restart the bot
$ sudo systemctl <start|stop|restart> brianbot

# Enable/Disable auto start on system boot
$ sudo systemctl <enable|disable> brianbot

# Check the status of the bot
$ sudo systemctl status brianbot
```

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
