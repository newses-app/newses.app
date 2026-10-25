import { RemovalPolicy, Stack, type StackProps, Tags } from 'aws-cdk-lib';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as pipelines from 'aws-cdk-lib/pipelines';
import type { Construct } from 'constructs';
import {
  APP_REPO,
  BUDGET_PROJECT,
  DEPLOY_CONFIG_PARAMETER,
  GITHUB_CONNECTION_ARN,
  GITHUB_REPO,
  resourceName,
  type SiteStageConfig,
} from './deploy-config.ts';
import { SiteStage } from './stage.ts';

const ARM_BUILD_IMAGE = codebuild.LinuxArmBuildImage.AMAZON_LINUX_2023_STANDARD_3_0;

/** The app repository's files the site publishes (`scripts/pull-app-docs.ts`). */
export const APP_DOC_PATHS = ['docs/architecture.md', 'docs/adr/**', 'AGENTS.md'];

/**
 * Self-mutating pipeline: each push to the stage's branch, or to the app's docs on its matching
 * branch, runs `pnpm check`, builds the site with the app's docs, deploys it, and smoke-tests it.
 */
export class PipelineStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: StackProps & {
      stage: SiteStageConfig;
      /** Built site; tests pass a fixture. */ siteDir?: string;
    },
  ) {
    super(scope, id, props);
    const { stage } = props;

    Tags.of(this).add('project', BUDGET_PROJECT);
    Tags.of(this).add('stage', stage.name);

    // Every build project logs here; otherwise CodeBuild creates a never-expiring group per
    // project, and asset projects are recreated with new names.
    const buildLogs = new logs.LogGroup(this, 'BuildLogs', {
      logGroupName: `/aws/codebuild/${resourceName(stage, 'pipeline')}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const site = pipelines.CodePipelineSource.connection(GITHUB_REPO, stage.branch, {
      connectionArn: GITHUB_CONNECTION_ARN,
      actionName: 'Site',
      // A full clone, so VitePress dates pages from their last commit.
      codeBuildCloneOutput: true,
    });
    const app = pipelines.CodePipelineSource.connection(APP_REPO, stage.appBranch, {
      connectionArn: GITHUB_CONNECTION_ARN,
      actionName: 'App',
    });
    const url = `https://${stage.domainName}`;

    const pipeline = new pipelines.CodePipeline(this, 'Pipeline', {
      pipelineName: resourceName(stage),
      // One project publishes every file asset, instead of one project per asset.
      publishAssetsInParallel: false,
      pipelineType: codepipeline.PipelineType.V2,
      crossAccountKeys: false,
      synth: new pipelines.CodeBuildStep('Synth', {
        input: site,
        additionalInputs: { '../newses': app },
        env: {
          NEWSES_APP_DIR: '../newses',
          SITE_URL: url,
          DOWNLOADS_URL: stage.downloadsUrl,
        },
        buildEnvironment: {
          buildImage: ARM_BUILD_IMAGE,
          computeType: codebuild.ComputeType.MEDIUM,
        },
        // Node 24 is preinstalled on the image, so this only selects it.
        partialBuildSpec: codebuild.BuildSpec.fromObject({
          phases: { install: { 'runtime-versions': { nodejs: 24 } } },
        }),
        installCommands: ['node --version', 'corepack enable', 'pnpm install --frozen-lockfile'],
        commands: [
          // The deployment config is kept out of the repository.
          `aws ssm get-parameter --name ${DEPLOY_CONFIG_PARAMETER} --query Parameter.Value --output text > infra/deploy.config.json`,
          'pnpm check',
          'pnpm audit --prod --audit-level high',
          'pnpm build',
          'pnpm cdk synth',
        ],
        primaryOutputDirectory: 'infra/cdk.out',
        rolePolicyStatements: [
          new iam.PolicyStatement({
            actions: ['ssm:GetParameter'],
            resources: [
              Stack.of(this).formatArn({
                service: 'ssm',
                resource: 'parameter',
                resourceName: DEPLOY_CONFIG_PARAMETER.slice(1),
              }),
            ],
          }),
          // The full clone; CDK grants only the legacy codestar-connections prefix.
          new iam.PolicyStatement({
            actions: ['codeconnections:UseConnection', 'codestar-connections:UseConnection'],
            resources: [GITHUB_CONNECTION_ARN],
          }),
        ],
      }),
      codeBuildDefaults: {
        buildEnvironment: { buildImage: ARM_BUILD_IMAGE },
        logging: { cloudWatch: { logGroup: buildLogs } },
      },
    });

    const head = (path = '/') => `curl -fsS -o /dev/null -D - ${url}${path}`;
    pipeline.addStage(
      new SiteStage(this, resourceName(stage), {
        stage,
        ...(props.siteDir !== undefined && { siteDir: props.siteDir }),
      }),
      {
        post: [
          new pipelines.ShellStep('SmokeTest', {
            commands: [
              `${head('/guide/self-hosting')} | grep -qi '^content-security-policy: '`,
              `${head()} | grep -qi '^strict-transport-security: '`,
              `test "$(curl -s -o /dev/null -w '%{http_code}' ${url}/no-such-page)" = 404`,
              ...(stage.noindex ? [`${head()} | grep -qi '^x-robots-tag: noindex'`] : []),
              ...stage.redirectFrom.map(
                (domain) =>
                  `test "$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' https://${domain}/guide/self-hosting)" = "301 ${url}/guide/self-hosting"`,
              ),
            ],
          }),
        ],
      },
    );

    // The site's pushes all deploy; the app's only when the docs the site publishes change.
    pipeline.buildPipeline();
    const sources = pipeline.pipeline.stages.find((s) => s.stageName === 'Source')?.actions ?? [];
    const sourceAction = (name: string) => {
      const action = sources.find((a) => a.actionProperties.actionName === name);
      if (!action) throw new Error(`No source action ${name}`);
      return action;
    };
    pipeline.pipeline.addTrigger({
      providerType: codepipeline.ProviderType.CODE_STAR_SOURCE_CONNECTION,
      gitConfiguration: {
        sourceAction: sourceAction('Site'),
        pushFilter: [{ branchesIncludes: [stage.branch] }],
      },
    });
    pipeline.pipeline.addTrigger({
      providerType: codepipeline.ProviderType.CODE_STAR_SOURCE_CONNECTION,
      gitConfiguration: {
        sourceAction: sourceAction('App'),
        pushFilter: [{ branchesIncludes: [stage.appBranch], filePathsIncludes: APP_DOC_PATHS }],
      },
    });
  }
}
