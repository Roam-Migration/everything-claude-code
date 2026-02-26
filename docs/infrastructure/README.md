# RML Infrastructure

Cross-cutting infrastructure documentation and automation for Roam Migration Law applications.

## Contents

- **docs/deployments/** - Deployment handover documents
- **docs/patterns/** - Reusable deployment patterns
- **docs/runbooks/** - Operational procedures

## Applications

- RML Intranet: https://intranet.roammigrationlaw.com
- Compass Wiki: (pending deployment)

## Tech Stack

- Google Cloud Platform (Cloud Run, IAP, Load Balancer)
- Docker containers
- Google Workspace SSO

## Cost Savings

Migrating from Vercel to GCP with IAP saves **$1,728-3,492/year per application**.

## Documentation

### Deployments
- [RML Intranet - GCP IAP Deployment](docs/deployments/RML_INTRANET_GCP_IAP_DEPLOYMENT_HANDOVER.md)

### Quick Links
- [GCP Console - rmlintranet](https://console.cloud.google.com/home/dashboard?project=rmlintranet)
- [IAP Settings](https://console.cloud.google.com/security/iap?project=rmlintranet)
- [OAuth Credentials](https://console.cloud.google.com/apis/credentials?project=rmlintranet)
