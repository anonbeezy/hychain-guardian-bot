import { GuardianExecution } from './GuardianExecution'

export abstract class Formatter {
  abstract format(execution: GuardianExecution): string
}
