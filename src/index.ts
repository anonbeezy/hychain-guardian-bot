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

new GuardianSession(
  new Tail(process.env.GUARDIAN_LOG_PATH),
  new TelegramFormatter(),
  new TelegramNotifier(
    new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true }),
    parseInt(process.env.CHAT_ID)
  )
).start()
