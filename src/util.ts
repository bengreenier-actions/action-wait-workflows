/* eslint-disable @typescript-eslint/explicit-function-return-type */
import * as github from '@actions/github'
import {Octokit} from '@octokit/action'

export async function find_run_for(commit: string, workflow_file: string) {
  const octokit = new Octokit()

  const workflows = await octokit.actions.listRepoWorkflows({
    ...github.context.repo
  })

  const workflow = workflows.data.workflows.find(wf =>
    wf.path.endsWith(workflow_file)
  )

  if (!workflow) {
    throw new Error(
      `Unable to find workflow matching path: ${workflow_file}. Searched:\n${JSON.stringify(
        workflows.data
      )}`
    )
  }

  const workflow_runs = await octokit.actions.listWorkflowRuns({
    ...github.context.repo,
    workflow_id: workflow.id
  })

  if (workflow_runs.data.total_count === 0) {
    throw new Error(`Unable to find workflow runs for workflow ${workflow.id}`)
  }

  const runs = workflow_runs.data.workflow_runs.filter(
    r => r.head_commit?.id === commit
  )

  if (runs.length === 0) {
    throw new Error(
      `Unable to find runs for commit '${commit}'. Searched:\n${JSON.stringify(
        workflow_runs.data
      )}`
    )
  }

  const run = runs.sort((a, b) => {
    const dateA = new Date(a.updated_at)
    const dateB = new Date(b.updated_at)

    return dateA.getTime() - dateB.getTime()
  })[0]

  return run
}

export async function poll_workflow_run(run_id: number) {
  const octokit = new Octokit()

  const run = await octokit.actions.getWorkflowRun({
    ...github.context.repo,
    run_id
  })

  return run.data
}
