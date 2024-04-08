import 'dotenv/config'
import { Tail } from 'tail'
import { TelegramFormatter } from './TelegramFormatter'
import { GuardianSession } from './GuardianSession'
import TelegramBot from 'node-telegram-bot-api'
import { TelegramNotifier } from './TelegramNotifier'
import path from 'path'
import { ExecutionWindow } from './ExecutionWindow'
import { statSync } from 'fs'
import { execFileSync, execSync } from 'child_process'
import assert from 'assert'

// Ensure that env vars are defined
const requiredEnvVars = [
  'TELEGRAM_BOT_TOKEN',
  'GROUP_CHAT_ID',
  'GUARDIAN_LOG_PATH',
  'GUARDIAN_TOPIC_ID',
  'CHECK_REWARDS_COMMAND',
  'CLAIM_REWARDS_COMMAND',
]

for (const envVar of requiredEnvVars) {
  assert(!!process.env[envVar], `${envVar} must be defined`)
}

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

bot.sendMessage(process.env.GROUP_CHAT_ID, '🤖 Bot started running')

abstract class TextHandler {
  abstract handle(bot: TelegramBot, msg: TelegramBot.Message): Promise<void>
}

class StartHandler extends TextHandler {
  async handle(bot: TelegramBot, msg: TelegramBot.Message) {
    const chatId = msg.chat.id
    const options = {
      reply_markup: {
        // keyboard: [['test']],
        inline_keyboard: [
          [{ text: 'Help', callback_data: 'help' }],
          [{ text: 'Check for rewards', callback_data: 'checkRewards' }],
          [{ text: 'Claim rewards', callback_data: 'claimRewards' }],
        ],
      },
    }
    bot.sendMessage(chatId, 'Choose a command:', options)
  }
}

abstract class CallbackQueryHandler {
  abstract handle(
    bot: TelegramBot,
    callbackQuery: TelegramBot.CallbackQuery
  ): Promise<void>
}

class CheckRewardsHandler extends CallbackQueryHandler {
  async handle(bot: TelegramBot, callbackQuery: TelegramBot.CallbackQuery) {
    const messageId = callbackQuery.message.chat.id

    await bot.sendMessage(messageId, 'Checking for rewards')
    const checkRewardsCommandOutput = execSync(
      process.env.CHECK_REWARDS_COMMAND
    )
    await bot.sendMessage(messageId, checkRewardsCommandOutput.toString())
  }
}

class ClaimRewardsHandler extends CallbackQueryHandler {
  async handle(bot: TelegramBot, callbackQuery: TelegramBot.CallbackQuery) {
    const messageId = callbackQuery.message.chat.id

    await bot.sendMessage(messageId, 'Claiming rewards')
    const claimRewardsCommandOutput = execSync(
      process.env.CLAIM_REWARDS_COMMAND
    )
    await bot.sendMessage(messageId, claimRewardsCommandOutput.toString())
  }
}

class App {
  textHandlerMapping: Map<RegExp, TextHandler> = new Map()
  callbackQueryHandlerMapping: Record<string, CallbackQueryHandler> = {}
  constructor(private bot: TelegramBot) {}
  useTextHandler(command: RegExp, handler: TextHandler) {
    this.textHandlerMapping.set(command, handler)
  }

  useCallbackQueryHandler(command: string, handler: CallbackQueryHandler) {
    this.callbackQueryHandlerMapping[command] = handler
  }
  async onCallbackQuery(callbackQuery: TelegramBot.CallbackQuery) {
    const messageId = callbackQuery.message.chat.id
    const data = callbackQuery.data // 'help' or 'echo'
    const id = callbackQuery.id // 'help' or 'echo'

    const handler = this.callbackQueryHandlerMapping[data]

    if (!handler) {
      await this.bot.sendMessage(messageId, `Handler not mapped to ${data}`)
    }

    await handler.handle(this.bot, callbackQuery)

    // Done with answer
    await this.bot.answerCallbackQuery(id)
  }

  registerCallbackQueryListener() {
    this.bot.on('callback_query', this.onCallbackQuery.bind(this))
  }

  registerMessageHandlers() {
    this.textHandlerMapping.forEach((handler, regex) => {
      this.bot.onText(regex, (msg) => handler.handle(this.bot, msg))
    })
  }
}

const app = new App(bot)

app.useTextHandler(/\/start/, new StartHandler())
app.useCallbackQueryHandler('checkRewards', new CheckRewardsHandler())
app.useCallbackQueryHandler('claimRewards', new ClaimRewardsHandler())

app.registerCallbackQueryListener()
app.registerMessageHandlers()
