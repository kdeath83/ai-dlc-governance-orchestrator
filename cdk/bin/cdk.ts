#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DlcGovStack } from '../lib/dlc-gov-stack';

const app = new cdk.App();
new DlcGovStack(app, 'DlcGovStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'ap-southeast-1',
  },
  tags: {
    Project: 'ai-dlc-governance-orchestrator',
    Environment: 'prototype',
    ManagedBy: 'cdk',
  },
});
