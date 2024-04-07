import type TelegramBot from 'node-telegram-bot-api'
import { Notifier } from './Notifier'

export class TelegramNotifier extends Notifier {
  constructor(
    private bot: TelegramBot,
    private chatId: TelegramBot.ChatId,
    private topicId?: number
  ) {
    super()
  }
  async notify(message: string) {
    await this.bot.sendMessage(this.chatId, `${message}`, {
      parse_mode: 'MarkdownV2',
      message_thread_id: this.topicId,
    })
  }
}
