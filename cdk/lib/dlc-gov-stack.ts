import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class DlcGovStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 bucket for steering files
    const steeringBucket = new s3.Bucket(this, 'SteeringBucket', {
      bucketName: `dlc-gov-steering-${this.account}-${this.region}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // DynamoDB table for audit trail
    const auditTable = new dynamodb.Table(this, 'AuditTable', {
      tableName: 'DlcGovAuditTrail',
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Lambda function for the orchestrator
    const dlcGovFunction = new lambda.Function(this, 'DlcGovFunction', {
      functionName: 'DlcGovFunction',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../dist'),
      memorySize: 2048,
      timeout: cdk.Duration.seconds(60),
      environment: {
        STEERING_BUCKET: steeringBucket.bucketName,
        AUDIT_TABLE: auditTable.tableName,
        NODE_ENV: 'production',
      },
      tracing: lambda.Tracing.ACTIVE,
    });

    // Grant permissions
    steeringBucket.grantReadWrite(dlcGovFunction);
    auditTable.grantReadWriteData(dlcGovFunction);

    // API Gateway
    const api = new apigw.RestApi(this, 'DlcGovApi', {
      restApiName: 'AI-DLC Governance Orchestrator',
      description: 'API for steering generation, audit, and risk gating',
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: apigw.Cors.ALL_METHODS,
      },
    });

    // API Key for protection
    const apiKey = api.addApiKey('DlcGovApiKey', {
      apiKeyName: 'dlc-gov-api-key',
    });

    const plan = api.addUsagePlan('DlcGovUsagePlan', {
      name: 'DlcGovUsagePlan',
      throttle: { rateLimit: 100, burstLimit: 200 },
      quota: { limit: 10000, period: apigw.Period.DAY },
    });

    plan.addApiKey(apiKey);

    // API Resources with API key required
    const generateResource = api.root.addResource('generate');
    generateResource.addMethod('POST', new apigw.LambdaIntegration(dlcGovFunction), {
      apiKeyRequired: true,
      methodResponses: [{ statusCode: '200' }, { statusCode: '400' }, { statusCode: '500' }],
    });

    const auditResource = api.root.addResource('audit');
    auditResource.addMethod('POST', new apigw.LambdaIntegration(dlcGovFunction), {
      apiKeyRequired: true,
      methodResponses: [{ statusCode: '200' }, { statusCode: '400' }, { statusCode: '500' }],
    });

    const gateResource = api.root.addResource('gate');
    gateResource.addMethod('POST', new apigw.LambdaIntegration(dlcGovFunction), {
      apiKeyRequired: true,
      methodResponses: [{ statusCode: '200' }, { statusCode: '400' }, { statusCode: '500' }],
    });

    plan.addApiStage({ stage: api.deploymentStage });

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway endpoint URL',
    });

    new cdk.CfnOutput(this, 'ApiKeyId', {
      value: apiKey.keyId,
      description: 'API Key ID for authentication',
    });

    new cdk.CfnOutput(this, 'SteeringBucketOutput', {
      value: steeringBucket.bucketName,
      description: 'S3 bucket for steering files',
    });

    new cdk.CfnOutput(this, 'AuditTableOutput', {
      value: auditTable.tableName,
      description: 'DynamoDB table for audit trail',
    });
  }
}
