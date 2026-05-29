#!/usr/bin/env bash
set -euo pipefail

# AI-DLC Governance Orchestrator — One-Click Deploy to AWS
# Deploys: S3 (steering files), DynamoDB (audit trail), Lambda (API), API Gateway
#
# Prerequisites:
#   - AWS CLI configured (aws configure)
#   - Node.js 18+
#   - npm / npx available
#
# Usage:
#   ./deploy.sh
#   ./deploy.sh --region ap-southeast-1
#   ./deploy.sh --profile my-aws-profile
#
# Post-deploy:
#   Stack outputs include API URL, API Key ID, S3 bucket, and DynamoDB table names.

REGION="${CDK_DEFAULT_REGION:-ap-southeast-1}"
AWS_PROFILE="${AWS_PROFILE:-}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --region)
      REGION="$2"
      shift 2
      ;;
    --profile)
      AWS_PROFILE="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: ./deploy.sh [--region <region>] [--profile <profile>]"
      exit 1
      ;;
  esac
done

AWS_OPTS=""
if [[ -n "$AWS_PROFILE" ]]; then
  AWS_OPTS="--profile $AWS_PROFILE"
fi

export CDK_DEFAULT_REGION="$REGION"

# ─── Banner ─────────────────────────────────────────────────────────
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  AI-DLC Governance Orchestrator — AWS One-Click Deploy        ║"
echo "║  Target: $REGION"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# ─── Prerequisites ────────────────────────────────────────────────
echo "→ Checking prerequisites..."

command -v aws >/dev/null 2>&1 || { echo "  ✗ AWS CLI not found. Install: https://docs.aws.amazon.com/cli/"; exit 1; }
echo "  ✓ AWS CLI"

command -v node >/dev/null 2>&1 || { echo "  ✗ Node.js not found. Install: https://nodejs.org/"; exit 1; }
echo "  ✓ Node.js $(node -v)"

command -v npx >/dev/null 2>&1 || { echo "  ✗ npx not found. Comes with npm."; exit 1; }
echo "  ✓ npx"

# Check AWS credentials
echo "→ Checking AWS credentials..."
if ! aws sts get-caller-identity $AWS_OPTS >/dev/null 2>&1; then
  echo "  ✗ AWS credentials not configured or invalid."
  echo "    Run: aws configure"
  echo "    Or:  export AWS_PROFILE=<profile>"
  exit 1
fi
ACCOUNT=$(aws sts get-caller-identity $AWS_OPTS --query Account --output text)
echo "  ✓ AWS authenticated (account: $ACCOUNT)"

# ─── Install & Build ──────────────────────────────────────────────
echo ""
echo "→ Installing dependencies..."
npm install

echo "→ Installing CDK dependencies..."
cd cdk
npm install
cd ..

echo "→ Building TypeScript..."
npm run build

# ─── CDK Bootstrap ────────────────────────────────────────────────
echo ""
echo "→ Bootstrapping CDK in $REGION..."
cd cdk
npx cdk bootstrap \
  --region "$REGION" \
  $AWS_OPTS \
  --require-approval never

# ─── Deploy ───────────────────────────────────────────────────────
echo ""
echo "→ Deploying stack to AWS..."
npx cdk deploy \
  --region "$REGION" \
  $AWS_OPTS \
  --require-approval never \
  --outputs-file ../cdk-outputs.json

cd ..

# ─── Summary ──────────────────────────────────────────────────────
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  ✅ DEPLOY COMPLETE                                            ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

if [[ -f cdk-outputs.json ]]; then
  echo "Stack outputs written to: cdk-outputs.json"
  echo ""
  echo "Key outputs:"
  cat cdk-outputs.json | python3 -c "
import json, sys
data = json.load(sys.stdin)
for stack, outputs in data.items():
    for k, v in outputs.items():
        print(f'  {k}: {v}')
" 2>/dev/null || cat cdk-outputs.json
fi

echo ""
echo "Next steps:"
echo "  1. Retrieve API key value from API Gateway console"
echo "  2. Test: curl -X POST <ApiUrl>/generate -H 'x-api-key: <key>'"
echo "  3. Delete: npx cdk destroy --force  (from cdk/ directory)"
echo ""
