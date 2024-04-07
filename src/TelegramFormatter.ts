import { ExecutionWindow } from './ExecutionWindow'
import { Formatter } from './Formatter'

export class TelegramFormatter extends Formatter {
  format(executions: ExecutionWindow) {
    const execution = executions.last()
    const totalSumSubmittedAssertions = sumSubmittedAssertions(executions)
    console.log(totalSumSubmittedAssertions)

    const statusEmoji = execution.submittedAssertions > 0 ? '🎉' : '💔'
    return `${statusEmoji} Submitted ${execution.submittedAssertions}/${
      execution.totalAssertions
    } assertions

Submitted ${totalSumSubmittedAssertions} in the last day \\(\`${
      Math.round((totalSumSubmittedAssertions / 24) * 100) / 100
    }\` per hour\\)

Started at \`${execution.startTime.toISOString()}\`
Finished at \`${execution.endTime.toISOString()}\`
`
  }
}

function sumSubmittedAssertions(executions: ExecutionWindow) {
  // Calculate the total change in value over the rolling window.
  return executions.getExecutions().reduce((sum, cur) => {
    return sum + cur.submittedAssertions
  }, 0)
}
