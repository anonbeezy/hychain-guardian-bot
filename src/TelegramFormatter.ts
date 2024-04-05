import type { Formatter } from './Formatter'
import { GuardianExecution } from './GuardianExecution'

export class TelegramFormatter implements Formatter {
  format(execution: GuardianExecution) {
    return `Execution details:
Started at ${execution.startTime.toISOString()}
Finished at ${execution.endTime.toISOString()}
Submitted ${execution.submittedAssertions}/${
      execution.totalAssertions
    } assertions`
  }
}
