#!/bin/bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_ID="rmlintranet"
SERVICE_NAME=""
REGION="us-central1"
REVISION=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --service)
      SERVICE_NAME="$2"
      shift 2
      ;;
    --revision)
      REVISION="$2"
      shift 2
      ;;
    --region)
      REGION="$2"
      shift 2
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

if [ -z "$SERVICE_NAME" ]; then
  read -p "Enter Cloud Run service name: " SERVICE_NAME
fi

echo -e "${YELLOW}Available revisions for $SERVICE_NAME:${NC}"
gcloud run revisions list \
  --service=$SERVICE_NAME \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format="table(name,status,traffic,creationTimestamp)"

echo ""

if [ -z "$REVISION" ]; then
  read -p "Enter revision name to rollback to: " REVISION
fi

echo ""
echo -e "${YELLOW}Rolling back to revision: $REVISION${NC}"

# Update traffic to route 100% to selected revision
gcloud run services update-traffic $SERVICE_NAME \
  --region=$REGION \
  --project=$PROJECT_ID \
  --to-revisions=$REVISION=100

echo ""
echo -e "${GREEN}✓ Rollback complete!${NC}"
echo "All traffic now routes to revision: $REVISION"
