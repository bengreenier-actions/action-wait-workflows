# action-wait-workflows

Waits for workflows to complete for a given commit before proceeding.

### Inputs

```
uses: bengreenier-actions/action-wait-workflows@v1
with:
  commit: "your_commit" # required
  workflow: "your_workflow.yml" # required
  workflow_conclusion: "success" # required
  timeout_ms: "300000" # optional, default 5m
```

Will continue successfully once `workflow` as reached `workflow_conclusion` for the most recent run against `commit`. Will fail if `timeout_ms` is reached first, or if the workflow reaches a different conclusion.
