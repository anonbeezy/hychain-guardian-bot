import 'dotenv/config'
import { Tail } from 'tail'
import { TelegramFormatter } from './TelegramFormatter'
import { GuardianSession } from './GuardianSession'
import TelegramBot from 'node-telegram-bot-api'
import { TelegramNotifier } from './TelegramNotifier'
import path from 'path'

let guardianLogPath = process.env.GUARDIAN_LOG_PATH || 'guardian.log'
if (!guardianLogPath.startsWith('/')) {
  // If not prefixed with a / then assume the path is relative
  guardianLogPath = path.resolve(process.cwd(), process.env.GUARDIAN_LOG_PATH)
}

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true })
bot.onText(/\/debug_message/, (msg) => {
  if (msg.is_topic_message) {
    bot.sendMessage(msg.chat.id, JSON.stringify(msg, null, 2), {
      message_thread_id: msg.message_thread_id,
      reply_to_message_id: msg.message_id,
    })
  } else {
    bot.sendMessage(msg.chat.id, JSON.stringify(msg, null, 2), {
      reply_to_message_id: msg.message_id,
    })
  }
})

new GuardianSession(
  new Tail(process.env.GUARDIAN_LOG_PATH),
  new TelegramFormatter(),
  new TelegramNotifier(bot, process.env.GUARDIAN_CHAT_ID)
).start()
