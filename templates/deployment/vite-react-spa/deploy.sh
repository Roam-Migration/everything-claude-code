#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="rmlintranet"
REGION="us-central1"
SERVICE_NAME=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --service)
      SERVICE_NAME="$2"
      shift 2
      ;;
    --region)
      REGION="$2"
      shift 2
      ;;
    --project)
      PROJECT_ID="$2"
      shift 2
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

# Prompt for service name if not provided
if [ -z "$SERVICE_NAME" ]; then
  read -p "Enter Cloud Run service name: " SERVICE_NAME
fi

echo -e "${YELLOW}Deploying to Google Cloud Run${NC}"
echo "Project: $PROJECT_ID"
echo "Service: $SERVICE_NAME"
echo "Region: $REGION"
echo ""

# Verify gcloud is configured
echo -e "${YELLOW}Verifying gcloud configuration...${NC}"
gcloud config set project $PROJECT_ID

# Submit build
echo -e "${YELLOW}Starting Cloud Build...${NC}"
gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions=_SERVICE_NAME=$SERVICE_NAME,_REGION=$REGION

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --format='value(status.url)')

echo ""
echo -e "${GREEN}✓ Deployment successful!${NC}"
echo -e "Service URL: ${GREEN}$SERVICE_URL${NC}"
echo ""
echo "Next steps:"
echo "1. Test the service: curl $SERVICE_URL/health"
echo "2. Configure IAP: ./scripts/setup-iap.sh --service=$SERVICE_NAME"
echo "3. Map custom domain: ./scripts/map-domain.sh --service=$SERVICE_NAME --domain=your-domain.roammigrationlaw.com"
