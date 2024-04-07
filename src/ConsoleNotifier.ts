import { Notifier } from './Notifier'

export class ConsoleNotifier extends Notifier {
  async notify(message: string) {
    console.log(message)
  }
}
