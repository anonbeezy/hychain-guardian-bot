import 'dotenv/config'
import { Tail } from 'tail'
import { TelegramFormatter } from './TelegramFormatter'
import { GuardianSession } from './GuardianSession'
import path from 'path'
import { ConsoleNotifier } from './ConsoleNotifier'
import { ExecutionWindow } from './ExecutionWindow'
import { execFileSync } from 'child_process'
import { statSync } from 'fs'

let guardianLogPath = process.env.GUARDIAN_LOG_PATH || 'guardian.log'
if (!guardianLogPath.startsWith('/')) {
  // If not prefixed with a / then assume the path is relative
  guardianLogPath = path.resolve(process.cwd(), process.env.GUARDIAN_LOG_PATH)
}

// Ensure that the log file exists
try {
  statSync(guardianLogPath)
} catch (e) {
  console.log(`The log file doesn't exist: ${guardianLogPath}`)
  process.exit(1)
}

// Get lines in log file
let lineCount = 0
try {
  const buf = execFileSync('wc', [
    '-l',
    path.resolve(process.cwd(), process.env.GUARDIAN_LOG_PATH),
  ])
  const match = buf.toString().match(/(\d+)/)
  lineCount = match ? parseInt(match[1]) : 0
} catch (e) {
  console.log(
    "There was an error getting line length. Either the command couldn't be found or the file doesn't exist"
  )
  process.exit(1)
}

new GuardianSession(
  new Tail(process.env.GUARDIAN_LOG_PATH, { fromBeginning: true }),
  new TelegramFormatter(),
  new ConsoleNotifier(),
  new ExecutionWindow()
).start(lineCount)
