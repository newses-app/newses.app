import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { App } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { describe, expect, it } from 'vitest';
import { ACCOUNT, CERTIFICATE_ARN, REGION, STAGES } from './deploy-config.ts';
import { APP_DOC_PATHS, PipelineStack } from './pipeline-stack.ts';
import { SiteStage } from './stage.ts';

const siteDir = mkdtempSync(join(tmpdir(), 'site-'));
mkdirSync(join(siteDir, 'assets'));
writeFileSync(join(siteDir, 'index.html'), '<!doctype html><script id="check">one()</script>');
writeFileSync(join(siteDir, '404.html'), '<!doctype html>');
writeFileSync(join(siteDir, 'assets/app.js'), '');

const [dev, prod] = STAGES;
if (!dev || !prod) throw new Error('dev and prod stages are configured');
const devStage = new SiteStage(new App(), 'Dev', { stage: dev, siteDir });
const prodStage = new SiteStage(new App(), 'Prod', { stage: prod, siteDir });
const devSite = Template.fromStack(devStage.site);
const prodSite = Template.fromStack(prodStage.site);

const responseHeaders = (template: Template) =>
  Object.values(template.findResources('AWS::CloudFront::ResponseHeadersPolicy'))[0] as {
    Properties: { ResponseHeadersPolicyConfig: Record<string, unknown> };
  };

describe('SiteStage', () => {
  it("names stacks under the site's prefix and tags them with the app's project", () => {
    expect([devStage.site.stackName, prodStage.site.stackName]).toEqual([
      'newses-site-dev-site',
      'newses-site-prod-site',
    ]);
    devSite.hasResourceProperties('AWS::S3::Bucket', {
      Tags: Match.arrayWith([
        { Key: 'project', Value: 'newses' },
        { Key: 'stage', Value: 'dev' },
      ]),
    });
  });

  it('serves the site from a private bucket, with clean URLs and a 404 page', () => {
    devSite.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: Match.objectLike({ BlockPublicAcls: true }),
    });
    devSite.resourceCountIs('AWS::CloudFront::OriginAccessControl', 1);
    devSite.hasResourceProperties('AWS::CloudFront::Function', {
      Name: 'newses-site-dev-routes',
      FunctionCode: Match.stringLikeRegexp('"https://dev\\.example\\.com" \\+ request\\.uri'),
    });
    devSite.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: Match.objectLike({
        Aliases: ['dev.example.com'],
        ViewerCertificate: Match.objectLike({ AcmCertificateArn: CERTIFICATE_ARN }),
        CustomErrorResponses: [403, 404].map((ErrorCode) => ({
          ErrorCode,
          ResponseCode: 404,
          ResponsePagePath: '/404.html',
        })),
      }),
    });
  });

  it("allows the pages' inline scripts and the downloads origin, and keeps dev unindexed", () => {
    const devHeaders = responseHeaders(devSite).Properties.ResponseHeadersPolicyConfig;
    const csp = JSON.stringify(devHeaders.SecurityHeadersConfig);
    expect(csp).toContain(
      "script-src 'self' 'sha256-HR7iaask9daLMRRskMI++QeJtjWDOjyPA6lGzYGzKW4='",
    );
    expect(csp).toContain("connect-src 'self' https://reader-dev.example.com;");
    expect(devHeaders.CustomHeadersConfig).toEqual({
      Items: [{ Header: 'x-robots-tag', Value: 'noindex', Override: true }],
    });
    const prodHeaders = responseHeaders(prodSite).Properties.ResponseHeadersPolicyConfig;
    expect(prodHeaders.CustomHeadersConfig).toBeUndefined();
    expect(JSON.stringify(prodHeaders.SecurityHeadersConfig)).toContain(
      "connect-src 'self' https://reader.example.com;",
    );
  });

  it('puts the apex and www on the prod distribution, www redirecting', () => {
    prodSite.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: Match.objectLike({ Aliases: ['example.com', 'www.example.com'] }),
    });
    for (const Type of ['A', 'AAAA']) {
      for (const Name of ['example.com.', 'www.example.com.']) {
        prodSite.hasResourceProperties('AWS::Route53::RecordSet', { Name, Type });
      }
      devSite.hasResourceProperties('AWS::Route53::RecordSet', { Name: 'dev.example.com.', Type });
    }
    prodSite.resourceCountIs('AWS::Route53::RecordSet', 4);
  });

  it('keeps assets for a year and revalidates and prunes the pages', () => {
    devSite.hasResourceProperties('Custom::CDKBucketDeployment', {
      DestinationBucketKeyPrefix: 'assets/',
      Prune: false,
      SystemMetadata: { 'cache-control': 'public, max-age=31536000, immutable' },
    });
    devSite.hasResourceProperties('Custom::CDKBucketDeployment', {
      Prune: true,
      Exclude: ['assets/*'],
      SystemMetadata: { 'cache-control': 'no-cache' },
      DistributionPaths: ['/*'],
    });
  });

  it('gives every Lambda function a log group the stack owns', () => {
    const functions = Object.values(devSite.findResources('AWS::Lambda::Function')) as {
      Properties: { LoggingConfig?: { LogGroup?: unknown } };
    }[];
    expect(functions.length).toBeGreaterThan(0);
    for (const fn of functions) expect(fn.Properties.LoggingConfig?.LogGroup).toBeDefined();
  });
});

describe('MailStack', () => {
  const mail = prodStage.mail && Template.fromStack(prodStage.mail);
  if (!mail) throw new Error('prod receives email');

  it('exists only on the stage that receives email', () => {
    expect(devStage.mail).toBeUndefined();
    expect(prodStage.mail?.stackName).toBe('newses-site-prod-mail');
  });

  it('verifies the domain and points its MX at SES in the region', () => {
    mail.hasResourceProperties('AWS::SES::EmailIdentity', { EmailIdentity: 'example.com' });
    mail.hasResourceProperties('AWS::Route53::RecordSet', {
      Type: 'MX',
      Name: 'example.com.',
      ResourceRecords: [`10 inbound-smtp.${REGION}.amazonaws.com`],
    });
  });

  it("publishes the addresses' mail, scanned and over TLS, to the topic", () => {
    mail.hasResourceProperties('AWS::SES::ReceiptRule', {
      RuleSetName: Match.anyValue(),
      Rule: Match.objectLike({
        Name: 'newses-site-prod-mail-forward',
        Enabled: true,
        Recipients: ['conduct@example.com'],
        ScanEnabled: true,
        TlsPolicy: 'Require',
        Actions: [{ SNSAction: { Encoding: 'UTF-8', TopicArn: Match.anyValue() } }],
      }),
    });
    const [policy] = Object.values(mail.findResources('AWS::SNS::TopicPolicy')) as {
      Properties: { PolicyDocument: { Statement: Record<string, unknown>[] } };
    }[];
    const [statement] = policy?.Properties.PolicyDocument.Statement ?? [];
    expect(statement).toMatchObject({
      Principal: { Service: 'ses.amazonaws.com' },
      Action: 'sns:Publish',
      Condition: { StringEquals: { 'aws:SourceAccount': ACCOUNT } },
    });
    expect(JSON.stringify(statement)).toContain(
      `:ses:${REGION}:${ACCOUNT}:receipt-rule-set/newses-site-prod-mail:receipt-rule/newses-site-prod-mail-forward`,
    );
  });

  it('gives the activation function a log group the stack owns', () => {
    for (const fn of Object.values(mail.findResources('AWS::Lambda::Function')) as {
      Properties: { LoggingConfig?: { LogGroup?: unknown } };
    }[]) {
      expect(fn.Properties.LoggingConfig?.LogGroup).toBeDefined();
    }
  });

  it('activates the rule set, and deactivates it on delete', () => {
    const [activate] = Object.values(mail.findResources('Custom::AWS')) as {
      Properties: { Create: string; Delete: string };
    }[];
    expect(JSON.parse(activate?.Properties.Create ?? '{}')).toMatchObject({
      action: 'setActiveReceiptRuleSet',
      parameters: { RuleSetName: 'newses-site-prod-mail' },
    });
    expect(JSON.parse(activate?.Properties.Delete ?? '{}')).toMatchObject({
      action: 'setActiveReceiptRuleSet',
      parameters: {},
    });
  });
});

describe('PipelineStack', () => {
  const template = (stage: typeof dev) =>
    Template.fromStack(
      new PipelineStack(new App(), `newses-site-${stage.name}-pipeline`, {
        env: { account: ACCOUNT, region: REGION },
        stage,
        siteDir,
      }),
    );
  const devPipeline = template(dev);
  const prodPipeline = template(prod);

  it("builds on pushes to the site's branch and to the app's docs on its branch", () => {
    devPipeline.hasResourceProperties('AWS::CodePipeline::Pipeline', {
      Name: 'newses-site-dev',
      PipelineType: 'V2',
      Triggers: [
        {
          ProviderType: 'CodeStarSourceConnection',
          GitConfiguration: {
            SourceActionName: 'Site',
            Push: [{ Branches: { Includes: ['dev'] } }],
          },
        },
        {
          ProviderType: 'CodeStarSourceConnection',
          GitConfiguration: {
            SourceActionName: 'App',
            Push: [{ Branches: { Includes: ['dev'] }, FilePaths: { Includes: APP_DOC_PATHS } }],
          },
        },
      ],
    });
    prodPipeline.hasResourceProperties('AWS::CodePipeline::Pipeline', {
      Triggers: Match.arrayWith([
        Match.objectLike({
          GitConfiguration: Match.objectLike({
            SourceActionName: 'App',
            Push: [Match.objectLike({ Branches: { Includes: ['main'] } })],
          }),
        }),
      ]),
    });
  });

  it("builds with the app's checkout beside the site and the stage's URLs", () => {
    const synth = JSON.stringify(devPipeline.findResources('AWS::CodeBuild::Project'));
    expect(synth).toMatch(/ln -s -- [^,]*CODEBUILD_SRC_DIR_owner_newses_Source[^,]*\.\.\/newses/);
    expect(synth).toContain('"Name":"NEWSES_APP_DIR","Type":"PLAINTEXT","Value":"../newses"');
    expect(synth).toContain('https://dev.example.com');
    expect(synth).toContain('https://reader-dev.example.com/downloads/');
  });

  it('smoke-tests the headers, the 404 page, and on prod the www redirect', () => {
    const dev = JSON.stringify(devPipeline.findResources('AWS::CodeBuild::Project'));
    const prod = JSON.stringify(prodPipeline.findResources('AWS::CodeBuild::Project'));
    expect(dev).toContain('x-robots-tag: noindex');
    expect(prod).not.toContain('x-robots-tag');
    expect(prod).toContain('https://www.example.com/guide/self-hosting');
    expect(dev).not.toContain('www.example.com');
  });
});
