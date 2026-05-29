# AI-DLC Governance Orchestrator

An end-to-end governance pipeline for AI-Driven Development Lifecycle (AI-DLC) that embeds jurisdiction-specific compliance into the software generation, validation, and deployment process.

## Rationale

This project implements the AI-DLC methodology described in the AWS blog post *"AI-Driven Development Lifecycle for Financial Services"* by Silvia Prieto, Jean-Francois Landreau, and Richard Caven (26 May 2026).

Regulated industries cannot rely on fully autonomous AI development or simple AI-assisted autocomplete. AI-DLC requires a middle path: AI agents orchestrate the development process while humans retain oversight, decision-making authority, and accountability. This orchestrator provides the tooling layer that makes that middle path enforceable.

## What It Does

The orchestrator connects three governance stages into a single pipeline:

1. **Steering Generation** — Defines what the AI agent is allowed to generate, based on jurisdiction-specific compliance frameworks (MAS Singapore, EU AI Act, AU APRA/ASIC).
2. **Traceability Validation** — Validates that every AI-generated change links back to a requirement, includes test coverage, and references a steering file.
3. **Risk-Based Gate** — Classifies changes by materiality and blocks human review for material changes before merge.

## One-Click Deploy to AWS

Deploy the full stack (S3, DynamoDB, Lambda, API Gateway) in a single command.

### Prerequisites

- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) configured (`aws configure`)
- [Node.js](https://nodejs.org/) 18+
- [AWS CDK](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html#getting_started_prerequisites) (`npm install -g aws-cdk`)

### Deploy

```bash
git clone https://github.com/kdeath83/ai-dlc-governance-orchestrator.git
cd ai-dlc-governance-orchestrator
./deploy.sh
```

**With options:**
```bash
# Deploy to a specific region
./deploy.sh --region ap-southeast-1

# Use a specific AWS profile
./deploy.sh --profile my-aws-profile

# Both
./deploy.sh --region ap-southeast-1 --profile my-aws-profile
```

**What it does:**
- Checks AWS credentials and Node.js
- Installs dependencies (root + `cdk/`)
- Builds TypeScript
- Bootstraps CDK in the target region
- Deploys the CloudFormation stack
- Writes stack outputs to `cdk-outputs.json`

**Infrastructure created:**

| Resource | Details |
|----------|---------|
| **S3 bucket** | `dlc-gov-steering-<account>-<region>` — versioned, SSE-S3 encrypted |
| **DynamoDB table** | `DlcGovAuditTrail` — pay-per-request, PITR enabled, AWS-managed encryption |
| **Lambda function** | `DlcGovFunction` — Node.js 20, 2GB RAM, 60s timeout, X-Ray tracing |
| **API Gateway** | REST API with `/generate`, `/audit`, `/gate` endpoints |
| **API Key** | Required for all endpoints, rate limited (100/s burst, 10K/day quota) |
| **IAM role** | Least privilege — S3 read/write, DynamoDB read/write, CloudWatch via managed policy |

### Test the API

After deploy, retrieve the API key from the **API Gateway console** (or `cdk-outputs.json` for the key ID):

```bash
# Get outputs
API_URL=$(cat cdk-outputs.json | python3 -c "import json,sys; d=json.load(sys.stdin); print(list(d.values())[0]['ApiUrl'])")
API_KEY=$(aws apigateway get-api-key --api-key-id $(cat cdk-outputs.json | python3 -c "import json,sys; d=json.load(sys.stdin); print(list(d.values())[0]['ApiKeyId'])") --include-value --query value --output text)

# Generate steering file
curl -X POST "$API_URL/generate" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jurisdiction":"MAS-SG","output":"/tmp/steering"}'

# Audit a commit
curl -X POST "$API_URL/audit" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"commit":"HEAD","steering":".dlc/steering/"}'

# Gate a PR
curl -X POST "$API_URL/gate" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"pr":"123","materiality":"MAS-SG","blockOn":"material"}'
```

### Teardown

```bash
cd cdk
npx cdk destroy --force
```

## Architecture

```
Steering File (.dlc/steering/default.yaml)
         |
         v
AI Agent (Kiro / Claude Code / Codex)
         |
         v
Commit / Pull Request
         |
         +--> Traceability Engine --> validates requirement chain
         |                          checks steering file presence
         |                          detects AI-generated markers
         |
         +--> Risk Gate --> classifies materiality
         |                  material = human review required
         |                  routine  = auto-pass with logging
         |
         v
Audit Report (JSON)
```

## Modules

### Module 1: Steering Generator

Generates structured steering files that configure AI agents to produce code aligned with enterprise requirements.

**Supported jurisdictions:**
- **MAS-SG** — Monetary Authority of Singapore (Technology Risk Management Guidelines, Cyber Security Framework)
- **EU-AI-ACT** — European Union Artificial Intelligence Act (Article 6, Risk Classification)
- **AU-APRA** — APRA / ASIC Australia (CPS 234 Cyber Security, RG 274 Risk Management)

**Usage:**
```bash
npx dlc-gov generate --jurisdiction=MAS-SG --output=.dlc/steering/
```

**Output:** `.dlc/steering/default.yaml` containing:
- Security policies (encryption, secrets rotation, approved dependencies, max CVE score)
- Architecture standards (allowed AWS regions, API versioning, multi-AZ)
- Regulatory requirements (human review, audit trail, risk classification)
- AI agent constraints (allowed agents, max code generation ratio, steering file requirement)

### Module 2: Traceability Engine

Scans commits for AI-generated code markers and validates the full compliance chain.

**Checks:**
- AI-generated marker detection in commit messages (`ai-generated`, `generated-by-*`, `kiro`, `claude-code`, `codex`, `copilot`, `[ai]`)
- Requirement link validation (`REQ-`, `USER-`, `JIRA-`, `#123`, GitHub issue links, Trello links)
- Test coverage presence (files matching `*test*`, `*spec*`, `*.test.ts`, `*.spec.ts`, etc.)
- Steering file presence in the repository

**Usage:**
```bash
npx dlc-gov audit --commit=HEAD --steering=.dlc/steering/
```

**Security note:** Commit hashes are sanitized before execution to prevent command injection. Only alphanumeric characters and `~^._-` are permitted.

### Module 3: Risk Gate

Classifies each changed file by materiality against jurisdiction-specific regex patterns.

**Material triggers (examples):**
- API contract changes
- Authentication / authorization flows
- Data handling / encryption logic
- Risk classification / scoring logic
- Model registry updates
- Payment flows
- Customer data handling
- Core banking systems

**Routine triggers:**
- UI / CSS / styling changes
- Documentation updates (`.md`, `.txt`)
- Image assets (`.png`, `.jpg`, `.svg`)
- Config files
- GitHub workflows and docs

**Usage:**
```bash
npx dlc-gov gate --pr=123 --materiality=MAS-SG --block-on=material
```

**PR detection:** For PR numbers other than `1`, the gate attempts to fetch files via `gh pr view`. Falls back to `git diff HEAD~1 HEAD` for local validation or `GATE_FILES` environment variable.

## CI/CD Integration

**GitHub Actions example (`.github/workflows/dlc-gov.yml`):**

```yaml
name: AI-DLC Governance Gate
on: [pull_request]
jobs:
  dlc-gov:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install -g ai-dlc-governance-orchestrator
      - run: dlc-gov generate --jurisdiction=MAS-SG --output=.dlc/steering/
      - run: dlc-gov gate --pr=${{ github.event.number }} --materiality=MAS-SG --block-on=material
```

## Security

The codebase has been reviewed for common vulnerabilities:

| Control | Implementation |
|---------|---------------|
| Command injection | Commit hash sanitized (`^[a-zA-Z0-9~^._-]+$`) |
| Path traversal | `isSafePath()` restricts to cwd, `/tmp`, and system temp directories |
| Regex DoS | Pattern compilation wrapped in try-catch with logging |
| Error disclosure | Lambda returns generic "Internal error" for 500s; message only for 400s |
| API auth | API Gateway requires API key on all endpoints |
| CORS | No blanket `*` origin; CORS preflight only on OPTIONS |
| Secrets | `.dockerignore` excludes `.env`, `.pem`, `.key` files |
| IAM least privilege | CloudWatch logs via `AWSLambdaBasicExecutionRole` (no custom `*` policy) |
| Encryption at rest | S3 SSE-S3, DynamoDB AWS-managed encryption |

## Repository Structure

```
ai-dlc-governance-orchestrator/
├── src/
│   ├── cli.ts                 # CLI entry point (Commander)
│   ├── generate/
│   │   ├── index.ts           # Steering file generator
│   │   └── jurisdictions/
│   │       └── mas-sg.ts      # MAS-SG, EU-AI-ACT, AU-APRA configs
│   ├── audit/
│   │   └── index.ts           # Commit traceability validator
│   ├── gate/
│   │   └── index.ts           # Materiality classifier
│   ├── shared/
│   │   ├── types.ts           # TypeScript interfaces
│   │   ├── config.ts          # Steering file loader / path validation
│   │   └── logger.ts          # Colored console output
│   └── lambda.ts              # AWS Lambda handler
├── cdk/
│   ├── bin/cdk.ts             # CDK app entry
│   ├── lib/dlc-gov-stack.ts   # Stack definition
│   └── cdk.json               # CDK configuration
├── tests/
│   ├── generate.test.ts       # Steering generation tests
│   └── gate.test.ts           # Materiality classification tests
├── examples/
│   └── mas-sg-example/        # Sample steering file + GitHub Actions workflow
├── deploy.sh                  # One-click deploy to AWS
├── Dockerfile                 # Container image (Alpine Linux, Node 20)
├── .dockerignore              # Excludes secrets, node_modules, docs
├── .gitignore                 # Excludes build outputs, env files
├── package.json               # npm manifest
├── tsconfig.json              # TypeScript config
└── README.md                  # This file
```

## Getting Started (Local)

```bash
# Clone and install
git clone https://github.com/kdeath83/ai-dlc-governance-orchestrator.git
cd ai-dlc-governance-orchestrator
npm install
cd cdk && npm install && cd ..

# Build
npm run build

# Test
npm test

# Generate steering file for your jurisdiction
npx dlc-gov generate --jurisdiction=MAS-SG

# Audit a commit
npx dlc-gov audit --commit=HEAD

# Gate a PR locally
npx dlc-gov gate --pr=1 --materiality=MAS-SG --block-on=material
```

## Development

```bash
# Local dev with ts-node
npm run dev -- generate --jurisdiction=EU-AI-ACT

# Lint
npm run lint

# CDK synth (dry run)
npm run cdk -- synth

# CDK deploy
npm run cdk -- deploy
```

## Limitations (Prototype)

This is a **prototype** demonstrating the art of the possible. Known limitations:

- **Audit module** requires a local git repository — does not work in Lambda without repo access (intended for CI/CD runners, not serverless)
- **Materiality detection** uses regex patterns, not semantic analysis — false positives/negatives possible
- **AI detection** is heuristic-based on commit message markers — does not analyze code provenance
- **Jurisdiction configs** are hardcoded — real-world use would load from a policy database or API
- **No S3/DynamoDB integration** in the Lambda handler yet — the infrastructure is defined but the code writes to local filesystem only
- **No steering file versioning** — no conflict resolution or merge strategy for concurrent updates

## References

**Primary Source**
- Prieto, S., Landreau, J-F., & Caven, R. (2026, 26 May). *AI-Driven Development Lifecycle for Financial Services*. AWS for Industries Blog. https://aws.amazon.com/blogs/industries/ai-driven-development-lifecycle-for-financial-services/

**Related AWS Content**
- AI-Driven Development Life Cycle (Methodology Introduction)
- Open-Sourcing Adaptive Workflows for AI-DLC
- Building with AI-DLC using Amazon Q Developer
- AI-DLC Method Definition Paper (Whitepaper)

## Contributing

Contributions for additional jurisdictions, CI/CD adapters, AST-based materiality detection, and steering file versioning are welcome.

## License

MIT
