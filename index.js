const TelegramBot = require('node-telegram-bot-api')
const dgram = require('dgram');
const server = dgram.createSocket('udp4');

const TG_TOKEN = ''
const TG_CHAT_ID = -1

const bot = new TelegramBot(TG_TOKEN, { polling: true })

// DEBUG
// bot.on('message', msg => {
//     console.log(msg)
// })

server.on('error', (err) => {
    console.log(`server error:\n${err.stack}`)
    server.close()
})

let messageBuffer = ''
let tag = ''
let level = 0
let timeout = 0

server.on('message', (msg, rinfo) => {
    console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`)

    const regex = msg.toString().match(/^(\S+)(\s+)(.*)$/)
    const msgLevel = Math.floor(regex[2].length / 4)
    if (tag == regex[1] && msgLevel > 0 && msgLevel >= level) {
        messageBuffer += ' '
        messageBuffer += regex[3]
        level = msgLevel

        clearTimeout(timeout)
        timeout = setTimeout(() => {
            messageBuffer += '\n```'
            bot.sendMessage(TG_CHAT_ID, messageBuffer, { parse_mode: 'MarkdownV2' })
            messageBuffer = ''
            tag = ''
            level = 0
        }, 100);
    } else {
        if (messageBuffer.length > 0) {
            messageBuffer += '\n```'
            bot.sendMessage(TG_CHAT_ID, messageBuffer, { parse_mode: 'MarkdownV2' })
        }

        tag = regex[1]
        level = msgLevel
        messageBuffer = `*${tag}*\n\n` + '```\n'
        messageBuffer += regex[3]

        clearTimeout(timeout)
        timeout = setTimeout(() => {
            messageBuffer += '\n```'
            bot.sendMessage(TG_CHAT_ID, messageBuffer, { parse_mode: 'MarkdownV2' })
            messageBuffer = ''
            tag = ''
            level = 0
        }, 100);
    }
})

server.on('listening', () => {
    const address = server.address();
    console.log(`server listening ${address.address}:${address.port}`)
})

server.bind(514);
