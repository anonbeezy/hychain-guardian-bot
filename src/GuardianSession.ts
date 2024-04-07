import type { Tail } from 'tail'
import type { Formatter } from './Formatter'
import { ExecutionWindow } from './ExecutionWindow'
import { Notifier } from './Notifier'

export class GuardianSession {
  private backfilling = false
  constructor(
    private tail: Tail,
    private formatter: Formatter,
    private notifier: Notifier,
    private executions: ExecutionWindow
  ) {}
  start(backfillLines?: number) {
    this.notifier.notify('🟢 Watching Guardian logs')

    let processedLines = 0

    if (backfillLines) {
      console.log('Backfilling from log')
      this.backfilling = true
    }

    this.tail.on('line', async (data) => {
      processedLines++

      if (processedLines >= backfillLines) {
        this.backfilling = false
      }

      await this.processLog(data)
    })
  }
  async processLog(log: string) {
    let currentExecution = this.executions.current()
    if (!currentExecution) {
      if (!this.backfilling) {
        console.log('Creating new execution')
      }
      currentExecution = this.executions.add()
    }

    currentExecution.processLog(log)

    if (currentExecution.complete) {
      if (this.backfilling) {
        return
      }
      console.log('Execution completed, notifying')
      await this.notifier.notify(this.formatter.format(this.executions))
    }
  }
}
