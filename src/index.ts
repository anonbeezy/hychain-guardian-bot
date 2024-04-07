import 'dotenv/config'
import { Tail } from 'tail'
import { TelegramFormatter } from './TelegramFormatter'
import { GuardianSession } from './GuardianSession'
import TelegramBot from 'node-telegram-bot-api'
import { TelegramNotifier } from './TelegramNotifier'
import path from 'path'
import { ExecutionWindow } from './ExecutionWindow'
import { statSync } from 'fs'
import { execFileSync } from 'child_process'

let guardianLogPath = process.env.GUARDIAN_LOG_PATH || 'guardian.log'
if (!guardianLogPath.startsWith('/')) {
  // If not prefixed with a / then assume the path is relative
  guardianLogPath = path.resolve(process.cwd(), process.env.GUARDIAN_LOG_PATH)
}

// Ensure that the log file exists
try {
  statSync(guardianLogPath)
} catch (e) {
  console.log(`The log file doesn't exist: ${guardianLogPath}`)
  process.exit(1)
}

// Get lines in log file
let lineCount = 0
try {
  const buf = execFileSync('wc', [
    '-l',
    path.resolve(process.cwd(), process.env.GUARDIAN_LOG_PATH),
  ])
  const match = buf.toString().match(/(\d+)/)
  lineCount = match ? parseInt(match[1]) : 0
} catch (e) {
  console.log(
    "There was an error getting line length. Either the command couldn't be found or the file doesn't exist"
  )
  process.exit(1)
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
  new Tail(process.env.GUARDIAN_LOG_PATH, { fromBeginning: true }),
  new TelegramFormatter(),
  new TelegramNotifier(
    bot,
    process.env.GROUP_CHAT_ID,
    parseInt(process.env.GUARDIAN_TOPIC_ID)
  ),
  new ExecutionWindow()
).start(lineCount)
