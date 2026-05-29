#!/usr/bin/env node
import { Command } from 'commander';
import { generate } from './generate';
import { audit } from './audit';
import { gate } from './gate';

const program = new Command();

program
  .name('dlc-gov')
  .description('AI-DLC Governance Orchestrator')
  .version('0.1.0');

program
  .command('generate')
  .description('Generate jurisdiction-specific steering file')
  .option('--jurisdiction <type>', 'jurisdiction code', 'MAS-SG')
  .option('--output <path>', 'output directory for steering file', '.dlc/steering/')
  .action(async (options) => {
    try {
      await generate(options);
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

program
  .command('audit')
  .description('Audit traceability of a commit')
  .option('--commit <hash>', 'commit hash to audit', 'HEAD')
  .option('--steering <path>', 'path to steering directory', '.dlc/steering/')
  .action(async (options) => {
    try {
      await audit(options);
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

program
  .command('gate')
  .description('Run risk-based materiality gate on a PR')
  .option('--pr <number>', 'PR number', '1')
  .option('--materiality <type>', 'jurisdiction materiality rules', 'MAS-SG')
  .option('--block-on <level>', 'level that triggers block', 'material')
  .action(async (options) => {
    try {
      await gate(options);
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

program.parse();
