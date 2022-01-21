import * as core from '@actions/core'
import {find_run_for, poll_workflow_run} from './util'

const param_names = {
  commit: 'commit',
  workflow: 'workflow',
  workflow_conclusion: 'workflow_conclusion',
  timeout_ms: 'timeout_ms'
}

async function run(): Promise<void> {
  try {
    const params = {
      commit: core.getInput(param_names.commit),
      workflow: core.getInput(param_names.workflow),
      workflow_conclusion: core.getInput(param_names.workflow_conclusion),
      timeout_ms: core.getInput(param_names.timeout_ms) ?? '300000'
    }

    const workflow_run = await find_run_for(params.commit, params.workflow)

    if (
      workflow_run.conclusion &&
      workflow_run.conclusion === params.workflow_conclusion
    ) {
      core.info(
        `Run ${workflow_run.id} for workflow ${workflow_run.workflow_id} is already ${params.workflow_conclusion}. Completing.`
      )

      // exit early
      return
    }

    // setup process timeout for unbounded job
    const process_timeout = setTimeout(() => {
      core.setFailed(new Error(`Timeout exceeded (${params.timeout_ms}ms)`))
      // force quit
      process.exit(1)
    }, Number(params.timeout_ms))

    // check every 30s
    const poll_interval = setInterval(() => {
      core.info(
        `Checking on run ${workflow_run.id} for workflow ${workflow_run.workflow_id}`
      )

      // eslint-disable-next-line github/no-then
      poll_workflow_run(workflow_run.id).then(
        polled_run => {
          // check if we have a value
          if (polled_run.conclusion) {
            // stop work
            clearInterval(poll_interval)
            clearTimeout(process_timeout)

            // something is wrong
            if (polled_run.conclusion !== params.workflow_conclusion) {
              core.setFailed(
                `Run ${workflow_run.id} for workflow ${workflow_run.workflow_id} reached '${polled_run.conclusion}' which does not match '${params.workflow_conclusion}'. Failing.`
              )
            }
            // notify complete!
            else {
              core.info(
                `Run ${workflow_run.id} for workflow ${workflow_run.workflow_id} is ${params.workflow_conclusion}. Completing.`
              )
            }
          }
        },
        err => {
          core.warning(`Poll attempt failed with '${err}'. Continuing...`)
        }
      )
    }, 30000)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
