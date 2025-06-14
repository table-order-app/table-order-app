import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as apprunner from 'aws-cdk-lib/aws-apprunner';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

interface AccortoConfig {
  env: cdk.Environment;
  projectName: string;
  environment: string;
  domainName?: string;
  certificateArn?: string;
}

interface AccortoInfrastructureStackProps extends cdk.StackProps {
  config: AccortoConfig;
}

export class AccortoInfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AccortoInfrastructureStackProps) {
    super(scope, id, props);

    const { config } = props;
    const { projectName, environment } = config;

    // VPC作成
    const vpc = new ec2.Vpc(this, 'AccortoVPC', {
      maxAzs: 2,
      natGateways: 1, // コスト削減のため1つのみ
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // データベース認証情報
    const dbCredentials = new secretsmanager.Secret(this, 'DatabaseCredentials', {
      description: 'Accorto database credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'accorto_admin' }),
        generateStringKey: 'password',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\\\',
        passwordLength: 32,
      },
    });

    // RDS PostgreSQL
    const database = new rds.DatabaseInstance(this, 'AccortoDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.SMALL),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      credentials: rds.Credentials.fromSecret(dbCredentials),
      allocatedStorage: 20,
      storageType: rds.StorageType.GP2,
      multiAz: true,
      backupRetention: cdk.Duration.days(7),
      deleteAutomatedBackups: true,
      deletionProtection: environment === 'production',
      databaseName: 'accorto',
      enablePerformanceInsights: true,
      performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
    });

    // S3バケット（画像保存用）
    const imagesBucket = new s3.Bucket(this, 'AccortoImagesBucket', {
      bucketName: `${projectName}-images-${environment}-${this.account}-${Date.now()}`,
      versioned: true,
      cors: [
        {
          allowedHeaders: ['*'],
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.POST, s3.HttpMethods.PUT],
          allowedOrigins: ['*'], // 本番では適切なオリジンに制限
          exposedHeaders: ['ETag'],
          maxAge: 3600,
        },
      ],
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
    });

    // CloudFront distribution for images
    const imagesDistribution = new cloudfront.Distribution(this, 'AccortoImagesDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(imagesBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true,
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // US/Europe only
    });

    // フロントエンドアプリ用S3バケット作成
    const frontendApps = ['table', 'admin', 'kitchen', 'staff'];
    const frontendBuckets: { [key: string]: s3.Bucket } = {};
    const frontendDistributions: { [key: string]: cloudfront.Distribution } = {};

    frontendApps.forEach(appName => {
      // S3バケット
      const bucket = new s3.Bucket(this, `Accorto${appName.charAt(0).toUpperCase() + appName.slice(1)}Bucket`, {
        bucketName: `${projectName}-${appName}-${environment}-${this.account}-${Date.now()}`,
        websiteIndexDocument: 'index.html',
        websiteErrorDocument: 'index.html', // SPA用
        publicReadAccess: true,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });

      frontendBuckets[appName] = bucket;

      // CloudFront distribution
      const distribution = new cloudfront.Distribution(this, `Accorto${appName.charAt(0).toUpperCase() + appName.slice(1)}Distribution`, {
        defaultBehavior: {
          origin: new origins.S3Origin(bucket),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          compress: true,
        },
        defaultRootObject: 'index.html',
        errorResponses: [
          {
            httpStatus: 404,
            responseHttpStatus: 200,
            responsePagePath: '/index.html',
            ttl: cdk.Duration.minutes(5),
          },
          {
            httpStatus: 403,
            responseHttpStatus: 200,
            responsePagePath: '/index.html',
            ttl: cdk.Duration.minutes(5),
          },
        ],
        priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      });

      frontendDistributions[appName] = distribution;
    });

    // ECRリポジトリ
    const ecrRepository = new ecr.Repository(this, 'AccortoBackendRepository', {
      repositoryName: `${projectName}-backend`,
      lifecycleRules: [
        {
          maxImageCount: 10, // 最新10イメージのみ保持
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // App Runner IAMロール
    const appRunnerRole = new iam.Role(this, 'AccortoAppRunnerRole', {
      assumedBy: new iam.ServicePrincipal('build.apprunner.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSAppRunnerServicePolicyForECRAccess'),
      ],
    });

    // App Runner instance role
    const appRunnerInstanceRole = new iam.Role(this, 'AccortoAppRunnerInstanceRole', {
      assumedBy: new iam.ServicePrincipal('tasks.apprunner.amazonaws.com'),
      inlinePolicies: {
        S3Access: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
              ],
              resources: [
                imagesBucket.bucketArn,
                `${imagesBucket.bucketArn}/*`,
              ],
            }),
          ],
        }),
        SecretsManagerAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'secretsmanager:GetSecretValue',
              ],
              resources: [
                dbCredentials.secretArn,
              ],
            }),
          ],
        }),
      },
    });

    // App Runner service
    const appRunnerService = new apprunner.CfnService(this, 'AccortoAppRunnerService', {
      serviceName: `${projectName}-backend-${environment}`,
      sourceConfiguration: {
        autoDeploymentsEnabled: false,
        imageRepository: {
          imageIdentifier: `${ecrRepository.repositoryUri}:latest`,
          imageConfiguration: {
            port: '8080',
            runtimeEnvironmentVariables: [
              { name: 'NODE_ENV', value: 'production' },
              { name: 'PORT', value: '8080' },
              { name: 'DATABASE_URL', value: `postgres://{{resolve:secretsmanager:${dbCredentials.secretArn}:SecretString:username}}:{{resolve:secretsmanager:${dbCredentials.secretArn}:SecretString:password}}@${database.instanceEndpoint.hostname}:5432/accorto` },
              { name: 'AWS_REGION', value: this.region },
              { name: 'S3_BUCKET_NAME', value: imagesBucket.bucketName },
              { name: 'CLOUDFRONT_URL', value: `https://${imagesDistribution.distributionDomainName}` },
              { name: 'ALLOWED_ORIGINS', value: frontendApps.map(app => `https://${frontendDistributions[app].distributionDomainName}`).join(',') },
              { name: 'JWT_SECRET', value: '{{resolve:secretsmanager:accorto-jwt-secret:SecretString:secret}}' },
              { name: 'BCRYPT_ROUNDS', value: '12' },
              { name: 'LOG_LEVEL', value: 'info' },
            ],
          },
          imageRepositoryType: 'ECR',
        },
      },
      instanceConfiguration: {
        cpu: '1 vCPU',
        memory: '2 GB',
        instanceRoleArn: appRunnerInstanceRole.roleArn,
      },
      healthCheckConfiguration: {
        protocol: 'HTTP',
        path: '/health',
        interval: 10,
        timeout: 5,
        healthyThreshold: 1,
        unhealthyThreshold: 5,
      },
      autoScalingConfigurationArn: `arn:aws:apprunner:${this.region}:${this.account}:autoscalingconfiguration/DefaultConfiguration/1/00000000000000000000000000000001`,
    });

    // データベース接続許可
    database.connections.allowFrom(
      ec2.Peer.ipv4('10.0.0.0/16'), // VPC内からの接続を許可
      ec2.Port.tcp(5432),
      'Allow App Runner to connect to database'
    );

    // 出力
    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS Database endpoint',
    });

    new cdk.CfnOutput(this, 'DatabaseCredentialsSecret', {
      value: dbCredentials.secretArn,
      description: 'Database credentials secret ARN',
    });

    new cdk.CfnOutput(this, 'ECRRepositoryUri', {
      value: ecrRepository.repositoryUri,
      description: 'ECR repository URI for backend image',
    });

    new cdk.CfnOutput(this, 'AppRunnerServiceUrl', {
      value: `https://${appRunnerService.attrServiceUrl}`,
      description: 'App Runner service URL',
    });

    new cdk.CfnOutput(this, 'ImagesBucketName', {
      value: imagesBucket.bucketName,
      description: 'S3 bucket for images',
    });

    new cdk.CfnOutput(this, 'ImagesCloudFrontUrl', {
      value: `https://${imagesDistribution.distributionDomainName}`,
      description: 'CloudFront URL for images',
    });

    frontendApps.forEach(appName => {
      new cdk.CfnOutput(this, `${appName.charAt(0).toUpperCase() + appName.slice(1)}BucketName`, {
        value: frontendBuckets[appName].bucketName,
        description: `S3 bucket for ${appName} app`,
      });

      new cdk.CfnOutput(this, `${appName.charAt(0).toUpperCase() + appName.slice(1)}CloudFrontUrl`, {
        value: `https://${frontendDistributions[appName].distributionDomainName}`,
        description: `CloudFront URL for ${appName} app`,
      });
    });
  }
}