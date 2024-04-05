import type { Formatter } from './Formatter'
import { GuardianExecution } from './GuardianExecution'

export class TelegramFormatter implements Formatter {
  format(execution: GuardianExecution) {
    const statusEmoji = execution.submittedAssertions > 0 ? '🎉' : '💔'
    return `${statusEmoji} Submitted ${execution.submittedAssertions}/${
      execution.totalAssertions
    } assertions

Started at \`${execution.startTime.toISOString()}\`
Finished at \`${execution.endTime.toISOString()}\`
`
  }
}
