'use strict';

require('dotenv').config();

const moment = require('moment');
const fs = require('fs');
require('moment-precise-range-plugin');

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
function getParagraphsFromFile(fileName) {
    return JSON.parse(fs.readFileSync(fileName)).map((p) => {
        return {
            paragraph: p,
            readingTime: 6000 * p.split(/\W+/).filter(token => token.toLowerCase().length >= 2).length / 25
        }
    })
}
function getCommandCooldown(paragraphsObj) {
    return paragraphsObj.reduce((accumulator, item, index) => (index in [0, paragraphsObj.length - 1]) ? 0 : accumulator + item.readingTime, 0);
}

function spamParagraphs(channel, commandWorks, paragraphs, cooldown) {
    if (commandWorks) {
        let i = 0;
        const job = () => {
            const el = paragraphs[i++];
            client.say(channel, el.paragraph);
            if (i < paragraphs.length) {
                setTimeout(job, el.readingTime);
            }
        }
        commandWorks = false;
        setTimeout(job, i);
        setTimeout(() => {
            commandWorks = true;
        }, cooldown);
    }
}

const jythonParagraphs = getParagraphsFromFile('paragraphs.json');
const jythonCooldown = getCommandCooldown(jythonParagraphs);
const kishinParagraphs = getParagraphsFromFile('kishin.json');
const kishinCooldown = getCommandCooldown(kishinParagraphs);
const birthday = moment('1991-05-27 13:00:00');
let commandsWork = true;

client.connect();

client.on('message', (channel, context, message, self) => {
    const isNotBot = context.username.toLowerCase() !== process.env.TWITCH_BOT_USERNAME.toLowerCase();
    if (!isNotBot) return;

    if (message[0] == "!" && !(self)) {
        message = message.replace("!", "");
        switch (message) {
            case 'jython':
                spamParagraphs(channel, commandsWork, jythonParagraphs, jythonCooldown);
                break;

            case 'age':
                if (commandsWork) {
                    const { years, months, days, hours } = moment.preciseDiff(birthday, moment(), true);
                    client.say(
                        channel,
                        `Years: ${years}${months ? `, month: ${months}` : ''}${days ? `, days: ${days}` : ''}${hours ? `, hours: ${hours}` : ''}`
                    );
                }
                break;

            case 'kishin':
                spamParagraphs(channel, commandsWork, kishinParagraphs, kishinCooldown);
                break
        }
    }
});