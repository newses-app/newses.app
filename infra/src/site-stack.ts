import { join } from 'node:path';
import { Duration, RemovalPolicy, Stack, type StackProps } from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import type { Construct } from 'constructs';
import { siteCsp } from './csp.ts';
import {
  CERTIFICATE_ARN,
  HOSTED_ZONE,
  REPO_ROOT,
  resourceName,
  type SiteStageConfig,
} from './deploy-config.ts';
import { siteRoutes } from './site-routes.ts';

export interface SiteStackProps extends StackProps {
  stage: SiteStageConfig;
  /** Built site; defaults to `.vitepress/dist`. */
  siteDir?: string;
}

/** CloudFront serving the built site from a private bucket on the stage's domains. */
export class SiteStack extends Stack {
  readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: SiteStackProps) {
    super(scope, id, props);
    const { stage } = props;
    const siteDir = props.siteDir ?? join(REPO_ROOT, '.vitepress/dist');

    const bucket = new s3.Bucket(this, 'Site', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const headers = new cloudfront.ResponseHeadersPolicy(this, 'Headers', {
      responseHeadersPolicyName: resourceName(stage, 'headers'),
      securityHeadersBehavior: {
        contentSecurityPolicy: {
          // The download page reads the app stage's latest.json.
          contentSecurityPolicy: siteCsp(siteDir, [new URL(stage.downloadsUrl).origin]),
          override: true,
        },
        contentTypeOptions: { override: true },
        frameOptions: { frameOption: cloudfront.HeadersFrameOption.DENY, override: true },
        referrerPolicy: {
          referrerPolicy: cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
          override: true,
        },
        strictTransportSecurity: {
          accessControlMaxAge: Duration.days(365),
          includeSubdomains: false,
          override: true,
        },
      },
      ...(stage.noindex && {
        customHeadersBehavior: {
          customHeaders: [{ header: 'x-robots-tag', value: 'noindex', override: true }],
        },
      }),
    });

    this.distribution = new cloudfront.Distribution(this, 'Cdn', {
      comment: `${resourceName(stage)} (${stage.domainName})`,
      domainNames: [stage.domainName, ...stage.redirectFrom],
      certificate: acm.Certificate.fromCertificateArn(this, 'Certificate', CERTIFICATE_ARN),
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(bucket, {
          originAccessControl: new cloudfront.S3OriginAccessControl(this, 'SiteAccess', {
            originAccessControlName: resourceName(stage, 'site'),
          }),
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        responseHeadersPolicy: headers,
        functionAssociations: [
          {
            eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
            function: new cloudfront.Function(this, 'Routes', {
              functionName: resourceName(stage, 'routes'),
              runtime: cloudfront.FunctionRuntime.JS_2_0,
              code: cloudfront.FunctionCode.fromInline(siteRoutes(stage.domainName)),
            }),
          },
        ],
      },
      // Without list access, S3 answers 403 for a missing page.
      errorResponses: [403, 404].map((httpStatus) => ({
        httpStatus,
        responseHttpStatus: 404,
        responsePagePath: '/404.html',
      })),
    });

    // VitePress fingerprints assets/, so they are immutable, and old ones stay for pages still
    // open on the previous build; everything else is revalidated, and pruned.
    const assets = new s3deploy.BucketDeployment(this, 'DeployAssets', {
      sources: [s3deploy.Source.asset(join(siteDir, 'assets'))],
      destinationBucket: bucket,
      destinationKeyPrefix: 'assets/',
      cacheControl: [s3deploy.CacheControl.fromString('public, max-age=31536000, immutable')],
      prune: false,
    });
    const pages = new s3deploy.BucketDeployment(this, 'DeployPages', {
      sources: [s3deploy.Source.asset(siteDir, { exclude: ['assets', 'assets/**'] })],
      destinationBucket: bucket,
      // Kept out of the sync, so pruning leaves them.
      exclude: ['assets/*'],
      cacheControl: [s3deploy.CacheControl.noCache()],
      prune: true,
      distribution: this.distribution,
      distributionPaths: ['/*'],
    });
    pages.node.addDependency(assets);

    const zone = route53.HostedZone.fromHostedZoneAttributes(this, 'Zone', HOSTED_ZONE);
    const target = route53.RecordTarget.fromAlias(
      new route53Targets.CloudFrontTarget(this.distribution),
    );
    for (const domain of [stage.domainName, ...stage.redirectFrom]) {
      const recordName =
        domain === HOSTED_ZONE.zoneName
          ? undefined
          : domain.slice(0, -HOSTED_ZONE.zoneName.length - 1);
      const id = recordName ?? 'Apex';
      new route53.ARecord(this, `${id}Alias`, { zone, recordName, target });
      new route53.AaaaRecord(this, `${id}AliasV6`, { zone, recordName, target });
    }
  }
}
