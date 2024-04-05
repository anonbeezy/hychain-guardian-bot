import type TelegramBot from 'node-telegram-bot-api'

export class TelegramNotifier {
  constructor(
    private bot: TelegramBot,
    private chatId: TelegramBot.ChatId,
    private topicId?: number
  ) {}
  notify(message: string) {
    return this.bot.sendMessage(this.chatId, `${message}`, {
      parse_mode: 'MarkdownV2',
      message_thread_id: this.topicId,
    })
  }
}
