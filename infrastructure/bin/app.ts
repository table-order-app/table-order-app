#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AccortoInfrastructureStack } from '../lib/accorto-infrastructure-stack';

const app = new cdk.App();

// 設定値を環境変数から取得
const config = {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'ap-northeast-1',
  },
  projectName: 'accorto',
  environment: process.env.ENVIRONMENT || 'production',
  domainName: process.env.DOMAIN_NAME, // optional
  certificateArn: process.env.CERTIFICATE_ARN, // optional
};

new AccortoInfrastructureStack(app, `AccortoInfrastructure-${config.environment}`, {
  env: config.env,
  config,
  description: 'Accorto table ordering system infrastructure',
  tags: {
    Project: config.projectName,
    Environment: config.environment,
  },
});