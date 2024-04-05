import type { Tail } from 'tail'
import type { Formatter } from './Formatter'
import { GuardianExecution } from './GuardianExecution'
import type { TelegramNotifier } from './TelegramNotifier'

export class GuardianSession {
  private execution: GuardianExecution
  constructor(
    private tail: Tail,
    private formatter: Formatter,
    private notifier: TelegramNotifier
  ) {}
  start() {
    this.notifier.notify('🟢 Watching Guardian logs')
    this.tail.on('line', async (data) => {
      await this.processLog(data)
    })
  }
  async processLog(log: string) {
    if (!this.execution || this.execution.complete) {
      console.log('Creating new execution')
      this.execution = new GuardianExecution()
    }

    this.execution.processLog(log)

    if (this.execution.complete) {
      console.log('Execution completed, notifying')
      await this.notifier.notify(this.formatter.format(this.execution))
    }
  }
}
