'use strict';

require('dotenv').config();

const client = new require('tmi.js').Client({
    connection: {
        reconnect: true
    },
    channels: ['memmo_twitch'],
    identity: {
        username: process.env.TWITCH_BOT_USERNAME,
        password: process.env.TWITCH_OAUTH_TOKEN
    },
});

const paragraphs = JSON.parse(require('fs').readFileSync('paragraphs.json')).map((p) => {
    return {
        paragraph: p,
        readingTime: 6000 * p.split(/\W+/).filter(token => token.toLowerCase().length >= 2).length / 25
    }
});
const jythonCooldown = paragraphs.reduce((accumulator, item, index) => (index in [0, paragraphs.length - 1]) ? 0 : accumulator + item.readingTime, 0);
const birthday = new Date(1991, 5, 27, 13, 0, 0, 0);
let jythonWorks = true;
client.connect();

client.on('message', (channel, context, message, self) => {
    const isNotBot = context.username.toLowerCase() !== process.env.TWITCH_BOT_USERNAME.toLowerCase();
    if (!isNotBot) return;

    if (message[0] == "!" && !(self)) {
        message = message.replace("!", "");
        switch (message) {
            case 'jython':
                if (jythonWorks) {
                    let i = 0;
                    const job = () => {
                        const el = paragraphs[i++];
                        client.say(channel, el.paragraph);
                        if (i < paragraphs.length) {
                            setTimeout(job, el.readingTime);
                        }
                    }
                    jythonWorks = false;
                    setTimeout(job, i);
                    setTimeout(() => {
                        jythonWorks = true;
                    }, jythonCooldown);
                }
                break;

            case 'age':
                const difference = new Date() - birthday;
                let seconds = Math.floor(difference / 1000),
                    minutes = Math.floor(seconds / 60),
                    hours = Math.floor(minutes / 60),
                    days = Math.floor(hours / 24),
                    months = Math.floor(days / 30),
                    years = Math.floor(days / 365);

                hours %= 24;
                days %= 30;
                months %= 12;

                client.say(
                    channel,
                    `Years: ${years}${months ? `, month: ${months}` : ''}${days ? `, days: ${days}` : ''}${hours ? `, hours: ${hours}` : ''}`
                );
                break;
        }
    }
});