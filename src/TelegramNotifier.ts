import type TelegramBot from 'node-telegram-bot-api'

export class TelegramNotifier {
  constructor(private bot: TelegramBot, private chatId: TelegramBot.ChatId) {}
  notify(message: string) {
    return this.bot.sendMessage(this.chatId, `${message}`, {
      parse_mode: 'MarkdownV2',
    })
  }
}
