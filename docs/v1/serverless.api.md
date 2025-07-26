
# Serverless API

```
DOTENV: Loading environment variables from .env:
Deploying "vm-orchestrator-api" to stage "dev" (us-east-1)

✔ Service deployed to stack vm-orchestrator-api-dev (49s)

endpoints:
  GET - https://ohb6y8uk2f.execute-api.us-east-1.amazonaws.com/api/vms
  POST - https://ohb6y8uk2f.execute-api.us-east-1.amazonaws.com/api/vms
  GET - https://ohb6y8uk2f.execute-api.us-east-1.amazonaws.com/api/vms/{id}
  PUT - https://ohb6y8uk2f.execute-api.us-east-1.amazonaws.com/api/vms/{id}
  DELETE - https://ohb6y8uk2f.execute-api.us-east-1.amazonaws.com/api/vms/{id}
  GET - https://ohb6y8uk2f.execute-api.us-east-1.amazonaws.com/api/vms/{vmId}/commands
  POST - https://ohb6y8uk2f.execute-api.us-east-1.amazonaws.com/api/vms/{vmId}/commands
  GET - https://ohb6y8uk2f.execute-api.us-east-1.amazonaws.com/api/commands/{id}
  PUT - https://ohb6y8uk2f.execute-api.us-east-1.amazonaws.com/api/commands/{id}
  DELETE - https://ohb6y8uk2f.execute-api.us-east-1.amazonaws.com/api/commands/{id}
  GET - https://ohb6y8uk2f.execute-api.us-east-1.amazonaws.com/api/vms/{vmId}/jobs
  PUT - https://ohb6y8uk2f.execute-api.us-east-1.amazonaws.com/api/jobs/{jobId}
  DELETE - https://ohb6y8uk2f.execute-api.us-east-1.amazonaws.com/api/jobs/{jobId}
functions:
  vmsApi: vm-orchestrator-api-dev-vmsApi (9 kB)
  commandsApi: vm-orchestrator-api-dev-commandsApi (9 kB)
  jobCacheApi: vm-orchestrator-api-dev-jobCacheApi (9 kB)
```