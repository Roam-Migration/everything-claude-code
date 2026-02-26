#!/bin/bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_ID="rmlintranet"
SERVICE_NAME=""
DOMAIN=""
REGION="us-central1"

while [[ $# -gt 0 ]]; do
  case $1 in
    --service)
      SERVICE_NAME="$2"
      shift 2
      ;;
    --domain)
      DOMAIN="$2"
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

if [ -z "$DOMAIN" ]; then
  read -p "Enter custom domain (e.g., intranet.roammigrationlaw.com): " DOMAIN
fi

echo -e "${YELLOW}Mapping custom domain to Cloud Run service${NC}"
echo "Service: $SERVICE_NAME"
echo "Domain: $DOMAIN"
echo ""

# Create domain mapping
gcloud run domain-mappings create \
  --service=$SERVICE_NAME \
  --domain=$DOMAIN \
  --region=$REGION \
  --project=$PROJECT_ID

# Get DNS records
echo ""
echo -e "${GREEN}Domain mapping created!${NC}"
echo ""
echo -e "${YELLOW}DNS Configuration Required:${NC}"
echo "Add the following CNAME record to your DNS provider:"
echo ""
echo "Type: CNAME"
echo "Name: ${DOMAIN%%.*}"  # Extracts subdomain
echo "Value: ghs.googlehosted.com"
echo "TTL: 3600"
echo ""
echo -e "${YELLOW}SSL Certificate:${NC}"
echo "Google will automatically provision an SSL certificate."
echo "This may take 10-60 minutes after DNS propagation."
echo ""
echo "Check status:"
echo "gcloud run domain-mappings describe --domain=$DOMAIN --region=$REGION"
