const extractTimeFromLog = (log: string): Date => {
  const match = log.match(
    /\[(?<hour>\d+):(?<minute>\d+):(?<second>\d+)\.(?<millisecond>\d+)\]/
  )
  const current = new Date()
  if (!match) {
    return current
  }

  const { hour, minute, second, millisecond } = match.groups

  current.setHours(
    parseInt(hour),
    parseInt(minute),
    parseInt(second),
    parseInt(millisecond)
  )

  return current
}

const extractAssertions = (log: string): number => {
  const match = log.match(
    /Submitting (?<assertions>\d+) assertions for challenge (?<challenge>\d+)/
  )

  if (!match) {
    return 0
  }

  return parseInt(match.groups.assertions)
}
export class GuardianExecution {
  startTime: Date
  endTime: Date
  submittedAssertions = 0
  totalAssertions = 0
  complete = false

  processLog(log: string) {
    if (log.includes('Starting guardian')) {
      this.startTime = extractTimeFromLog(log)
    }

    if (log.includes('Submitting')) {
      this.submittedAssertions += extractAssertions(log)
      this.totalAssertions++
    }

    if (log.includes('Finished processing challenges')) {
      this.endTime = extractTimeFromLog(log)
      this.complete = true
    }
  }
}
