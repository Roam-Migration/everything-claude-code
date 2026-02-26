#!/bin/bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_ID="rmlintranet"
SERVICE_NAME=""
REGION="us-central1"

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
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

if [ -z "$SERVICE_NAME" ]; then
  read -p "Enter Cloud Run service name: " SERVICE_NAME
fi

echo -e "${YELLOW}Setting up Identity-Aware Proxy for $SERVICE_NAME${NC}"
echo ""

# Step 1: Enable IAP API
echo -e "${YELLOW}Enabling IAP API...${NC}"
gcloud services enable iap.googleapis.com --project=$PROJECT_ID

# Step 2: Create backend service
echo -e "${YELLOW}Creating backend service...${NC}"
echo ""
echo -e "${YELLOW}MANUAL STEPS REQUIRED:${NC}"
echo "1. Go to: https://console.cloud.google.com/security/iap?project=$PROJECT_ID"
echo "2. Find your Cloud Run service: $SERVICE_NAME"
echo "3. Click 'Configure OAuth Consent Screen' if not done already"
echo "   - User Type: Internal"
echo "   - App Name: RML Internal Apps"
echo "   - User Support Email: j.taylor@roammigrationlaw.com"
echo "4. Create OAuth Client ID:"
echo "   - Application Type: Web application"
echo "   - Name: IAP-$SERVICE_NAME"
echo "5. Enable IAP toggle for $SERVICE_NAME"
echo "6. Add members: domain:roammigrationlaw.com"
echo "   - Role: IAP-secured Web App User"
echo ""
echo -e "${GREEN}After completing OAuth setup, IAP will be active.${NC}"
echo "Test with: curl -H 'Authorization: Bearer \$(gcloud auth print-identity-token)' <SERVICE_URL>"
