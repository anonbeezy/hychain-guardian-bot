import { GuardianExecution } from './GuardianExecution'

export class ExecutionWindow {
  private executions: GuardianExecution[] = []
  add() {
    const execution = new GuardianExecution()
    this.executions.push(execution)

    if (this.executions.length > 24) {
      this.executions.shift()
    }

    return execution
  }

  getExecutions() {
    return this.executions
  }

  first() {
    return this.executions[0]
  }

  last() {
    return this.executions[this.executions.length - 1]
  }

  current() {
    const lastExecution = this.last()
    if (!lastExecution) {
      return null
    }

    return lastExecution.complete ? null : lastExecution
  }

  isEmpty() {
    return this.executions.length === 0
  }
}
