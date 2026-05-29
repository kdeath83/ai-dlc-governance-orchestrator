# AI-DLC Governance Orchestrator

An end-to-end governance pipeline for AI-Driven Development Lifecycle (AI-DLC) that embeds jurisdiction-specific compliance into the software generation, validation, and deployment process.

## Rationale

This project is a direct implementation of the AI-DLC methodology described in the AWS blog post
"AI-Driven Development Lifecycle for Financial Services" by Silvia Prieto, Jean-Francois Landreau, and Richard Caven (26 May 2026).

The article establishes that regulated industries cannot rely on fully autonomous AI development or simple AI-assisted autocomplete. AI-DLC requires a middle path: AI agents orchestrate the development process while humans retain oversight, decision-making authority, and accountability.

This orchestrator provides the tooling layer that makes that middle path enforceable.

## What It Does

The orchestrator connects three governance stages into a single pipeline:

1. **Steering Generation** — Defines what the AI agent is allowed to generate, based on jurisdiction-specific compliance frameworks (MAS Singapore, EU AI Act, AU APRA/ASIC).
2. **Traceability Validation** — Validates that every AI-generated change links back to a user story, requirement, and test, with a steering file reference.
3. **Risk-Based Gate** — Classifies changes by materiality and blocks human review for material changes before merge.

## Architecture

```
Steering File (.dlc/steering/)
         |
         v
AI Agent (Kiro / Claude Code / Codex)
         |
         v
Commit / Pull Request
         |
         +--> Traceability Engine --> validates requirement chain
         |                          checks steering file reference
         |
         +--> Risk Gate --> classifies materiality
         |                  material = human review block
         |                  routine  = auto-pass with logging
         |
         v
Audit Report (JSON / Markdown / SARIF)
```

## Modules

### Module 1: Steering Generator

Generates structured steering files that configure AI agents to produce code aligned with enterprise requirements.

Supported jurisdictions:
- SG MAS (Technology Risk Management Guidelines)
- EU AI Act (Article 6, risk classification)
- AU APRA / ASIC (CPS 234, RG 274)

Usage:
```bash
npx dlc-gov generate --jurisdiction=MAS-SG --output=.dlc/steering/
```

Output: `.dlc/steering/default.yaml` containing security policies, architecture standards, approved dependencies, and regulatory guidelines.

### Module 2: Traceability Engine

Scans commits and PRs for AI-generated code markers, then validates the full chain.

Checks:
- Every AI-generated commit links to a requirement ID
- Code changes reference a test case
- Steering file used in generation is present in repo
- No gaps between user story and production code

Usage:
```bash
npx dlc-gov audit --commit=HEAD --steering=.dlc/steering/
```

### Module 3: Risk Gate

Classifies each change by materiality against jurisdiction-specific thresholds.

Material triggers (examples):
- API contract changes
- Data handling / encryption logic
- Authentication / authorization flows
- Risk classification / scoring logic
- Model registry updates

Routine triggers:
- UI / CSS tweaks
- Documentation updates
- Config file changes
- Dependency version bumps (approved list)

Usage:
```bash
npx dlc-gov gate --pr=123 --materiality=MAS-SG --block-on=material
```

## CI/CD Integration

Add to `.github/workflows/dlc-gov.yml`:

```yaml
name: AI-DLC Governance Gate
on: [pull_request]
jobs:
  dlc-gov:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/dlc-gov
        with:
          jurisdiction: MAS-SG
          steering-path: .dlc/steering/
          block-on: material
```

## Repository Structure

```
ai-dlc-governance-orchestrator/
├── README.md
├── LICENSE
├── package.json
├── src/
│   ├── cli.ts                    # Entry point
│   ├── generate/
│   │   ├── index.ts              # Steering generator orchestrator
│   │   ├── jurisdictions/
│   │   │   ├── mas-sg.ts         # MAS Singapore rules
│   │   │   ├── eu-ai-act.ts      # EU AI Act rules
│   │   │   └── au-apra-asic.ts   # AU APRA/ASIC rules
│   │   ├── templates/
│   │   │   └── default.yaml.hbs  # Steering file template
│   │   └── types.ts
│   ├── audit/
│   │   ├── index.ts              # Traceability engine
│   │   ├── parsers/
│   │   │   ├── git.ts            # Git commit parser
│   │   │   ├── ast.ts            # AST-based change detection
│   │   │   └── ai-marker.ts      # AI-generated code detection
│   │   ├── validators/
│   │   │   ├── requirement-link.ts
│   │   │   ├── test-coverage.ts
│   │   │   └── steering-ref.ts
│   │   └── reporters/
│   │       ├── json.ts
│   │       ├── markdown.ts
│   │       └── sarif.ts
│   ├── gate/
│   │   ├── index.ts              # Risk gate orchestrator
│   │   ├── classifiers/
│   │   │   ├── materiality.ts    # Material vs routine logic
│   │   │   └── jurisdiction.ts   # Jurisdiction-specific thresholds
│   │   ├── blockers/
│   │   │   └── github.ts         # GitHub PR review block
│   │   └── reporters/
│   │       └── audit-trail.ts
│   └── shared/
│       ├── types.ts
│       ├── config.ts
│       └── logger.ts
├── .dlc/
│   └── steering/                 # Generated steering files
│       └── default.yaml
├── tests/
│   ├── generate.test.ts
│   ├── audit.test.ts
│   └── gate.test.ts
├── examples/
│   ├── mas-sg-example/
│   │   ├── .dlc/steering/default.yaml
│   │   └── .github/workflows/dlc-gov.yml
│   ├── eu-ai-act-example/
│   └── au-apra-example/
├── docs/
│   ├── architecture.md
│   ├── jurisdictions.md
│   └── contributing.md
└── .github/
    ├── workflows/
    │   └── ci.yml
    └── actions/
        └── dlc-gov/
            ├── action.yml
            └── index.js
```

## Getting Started

```bash
# Clone and install
git clone https://github.com/kdeath83/ai-dlc-governance-orchestrator.git
cd ai-dlc-governance-orchestrator
npm install

# Generate steering file for your jurisdiction
npx dlc-gov generate --jurisdiction=MAS-SG

# Audit a commit
npx dlc-gov audit --commit=HEAD

# Gate a PR
npx dlc-gov gate --pr=42 --block-on=material
```

## References

This project is built on the methodology and evidence presented in:

**Primary Source**
- Prieto, S., Landreau, J-F., & Caven, R. (2026, 26 May). *AI-Driven Development Lifecycle for Financial Services*. AWS for Industries Blog. https://aws.amazon.com/blogs/industries/ai-driven-development-lifecycle-for-financial-services/

**Further Reading (as cited in the original article)**
- AWS Blog: AI-Driven Development Life Cycle (Methodology Introduction) — The original blog post announcing and explaining the AI-DLC methodology
- AWS Blog: Open-Sourcing Adaptive Workflows for AI-DLC — Explains how AI-DLC addresses rigid workflows, inflexible depth, and over-automation, and introduces the open-source implementation
- AWS Blog: Building with AI-DLC using Amazon Q Developer — A practical walkthrough of the AI-DLC workflow in action using Amazon Q Developer
- AI-DLC Method Definition Paper (Whitepaper) — The full methodology whitepaper describing the principles, phases, and workflow patterns in depth

## Contributing

This is an open-source project. Contributions for additional jurisdictions, CI/CD adapters, and steering file templates are welcome.

## License

MIT
