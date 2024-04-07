import { ExecutionWindow } from './ExecutionWindow'

export abstract class Formatter {
  abstract format(executions: ExecutionWindow): string
}
