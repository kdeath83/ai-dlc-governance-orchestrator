#!/usr/bin/env bash
set -euo pipefail

# AI-DLC Governance Orchestrator — One-Click Deploy
# Requires: AWS CLI, AWS CDK, Node.js 18+

echo "=========================================="
echo "AI-DLC Governance Orchestrator Deploy"
echo "=========================================="
echo ""

# Check prerequisites
command -v aws >/dev/null 2>&1 || { echo "Error: AWS CLI required"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "Error: Node.js required"; exit 1; }
command -v npx >/dev/null 2>&1 || { echo "Error: npx required"; exit 1; }

# Check AWS credentials
aws sts get-caller-identity >/dev/null 2>&1 || {
  echo "Error: AWS credentials not configured"
  echo "Run: aws configure"
  exit 1
}

# Install dependencies
echo "→ Installing dependencies..."
npm install
cd cdk && npm install && cd ..

# Build TypeScript
echo "→ Building TypeScript..."
npm run build

# Bootstrap CDK (if needed)
echo "→ Bootstrapping CDK..."
cd cdk
npx cdk bootstrap --require-approval never
cd ..

# Deploy
echo "→ Deploying to AWS..."
cd cdk
npx cdk deploy --require-approval never
cd ..

echo ""
echo "✓ Deploy complete"
echo ""
echo "Next steps:"
echo "  1. Check AWS CloudFormation console for stack status"
echo "  2. Retrieve API key from API Gateway console"
echo "  3. Test: curl -X POST <API_URL>/generate"
