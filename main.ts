import { config } from 'dotenv';
import fs from 'fs';
import moment, { type Moment } from 'moment';
import 'moment-precise-range-plugin';
import { Client, type ChatUserstate } from 'tmi.js';

config();

interface Paragraph {
    paragraph: string;
    readingTime: number;
}

const client: Client = new Client({
    connection: {
        reconnect: true,
    },
    channels: ['memmo_twitch'],
    identity: {
        username: process.env.TWITCH_BOT_USERNAME,
        password: process.env.TWITCH_OAUTH_TOKEN,
    },
});

function getParagraphsFromFile(fileName: string): Paragraph[] {
    return JSON.parse(fs.readFileSync(fileName, 'utf-8')).map((p: string) => {
        return {
            paragraph: p,
            readingTime: 6000 * p.split(/\W+/).filter((token: string) => token.toLowerCase().length >= 2).length / 25,
        };
    });
}

function getCommandCooldown(paragraphs: Paragraph[]): number {
    return paragraphs.reduce((accumulator, item, index) => (index === 0 || index === paragraphs.length - 1) ? 0 : accumulator + item.readingTime, 0);
}

function spamParagraphs(channel: string, commandWorks: boolean, paragraphs: Paragraph[], cooldown: number): void {
    if (commandWorks) {
        let i: number = 0;
        const job: () => void = () => {
            const el = paragraphs[i++];
            client.say(channel, el.paragraph);
            if (i < paragraphs.length) {
                setTimeout(job, el.readingTime);
            }
        };
        commandWorks = false;
        setTimeout(job, i);
        setTimeout(() => {
            commandWorks = true;
        }, cooldown);
    }
}

const jythonParagraphs: Paragraph[] = getParagraphsFromFile('paragraphs.json');
const jythonCooldown: number = getCommandCooldown(jythonParagraphs);
const kishinParagraphs: Paragraph[] = getParagraphsFromFile('kishin.json');
const kishinCooldown: number = getCommandCooldown(kishinParagraphs);
const birthday: Moment = moment('1991-05-27 13:00:00');
let commandsWork: boolean = true;

client.connect();

client.on('message', (channel: string, context: ChatUserstate, message: string, self: boolean) => {
    const isNotBot: boolean = context.username?.toLowerCase() !== process.env.TWITCH_BOT_USERNAME?.toLowerCase();
    if (!isNotBot) return;

    if (message.startsWith('!') && !self) {
        message = message.replace('!', '');
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
                break;
        }
    }
    if (message.toLowerCase().includes('design')) {
        client.say(channel, 'Hai detto design KappaPride');
    }
    if (message.toLowerCase().includes('memoria')) {
        client.say(channel, 'Hai detto memoria KappaPride');
    }
    if (message.toLowerCase().includes('concorrenza')) {
        client.say(channel, 'Hai detto concorrenza KappaPride');
    }
});
console.log('Memmo_bot started');
