import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

export const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));

const stageSchema = z.object({
  name: z.enum(['dev', 'prod']),
  /** Branch of this repository whose pushes deploy the stage. */
  branch: z.string().min(1),
  /** Branch of the app repository whose docs the stage publishes under `/contributing/`. */
  appBranch: z.string().min(1),
  domainName: z.string().min(1),
  /** Domains that redirect to `domainName` (`www`). */
  redirectFrom: z.array(z.string().min(1)),
  /** Asks search engines not to index the stage. */
  noindex: z.boolean(),
  /** The app stage's downloads folder, whose `latest.json` the download page reads. */
  downloadsUrl: z.url({ protocol: /^https$/ }).endsWith('/'),
  /** Addresses at `domainName` whose mail SES receives and publishes to the stage's mail topic. */
  inboundEmail: z.object({ addresses: z.array(z.email()).min(1) }).optional(),
});

export type SiteStageConfig = z.infer<typeof stageSchema>;

export const deployConfigSchema = z
  .object({
    /** Prefix of every physical name and parameter path of the site's resources. */
    resourcePrefix: z.string().regex(/^[a-z][a-z0-9-]*$/),
    /**
     * The app deployment's `resourcePrefix`: the site is tagged `project=<it>`, so the app's
     * project budget counts it.
     */
    budgetProject: z.string().regex(/^[a-z][a-z0-9-]*$/),
    account: z.string().regex(/^\d{12}$/),
    region: z.string().min(1),
    /** `owner/name` of this repository. */
    githubRepo: z.string().regex(/^[^/]+\/[^/]+$/),
    /** `owner/name` of the app repository, whose docs the site publishes. */
    appRepo: z.string().regex(/^[^/]+\/[^/]+$/),
    /** CodeConnections connection with access to both repositories. */
    githubConnectionArn: z.string().startsWith('arn:aws:'),
    /** Covers every stage's domains; CloudFront requires certificates from us-east-1. */
    certificateArn: z.string().startsWith('arn:aws:acm:us-east-1:'),
    /** The Route 53 zone every domain is in. */
    hostedZone: z.object({ zoneName: z.string().min(1), hostedZoneId: z.string().min(1) }),
    stages: z.array(stageSchema).min(1),
  })
  .superRefine((config, ctx) => {
    const zone = config.hostedZone.zoneName;
    const domains = config.stages.flatMap((stage) => [stage.domainName, ...stage.redirectFrom]);
    for (const domain of domains) {
      if (domain !== zone && !domain.endsWith(`.${zone}`)) {
        ctx.addIssue({ code: 'custom', message: `${domain} is not in ${zone}` });
      }
    }
    if (new Set(domains).size !== domains.length) {
      ctx.addIssue({ code: 'custom', message: 'domains repeat' });
    }
    if (new Set(config.stages.map((stage) => stage.name)).size !== config.stages.length) {
      ctx.addIssue({ code: 'custom', message: 'stage names repeat' });
    }
    for (const stage of config.stages) {
      for (const address of stage.inboundEmail?.addresses ?? []) {
        if (!address.endsWith(`@${stage.domainName}`)) {
          ctx.addIssue({ code: 'custom', message: `${address} is not at ${stage.domainName}` });
        }
      }
    }
    // An account has one active receipt rule set per region.
    if (config.stages.filter((stage) => stage.inboundEmail).length > 1) {
      ctx.addIssue({ code: 'custom', message: 'only one stage can receive email' });
    }
  });

// The deployment's account-specific values, from `infra/deploy.config.json` (not committed; see
// `deploy.config.example.json`) or the file `NEWSES_SITE_DEPLOY_CONFIG` names. The pipelines'
// synth step writes the file from the `DEPLOY_CONFIG_PARAMETER` parameter.
const path =
  process.env.NEWSES_SITE_DEPLOY_CONFIG ??
  fileURLToPath(new URL('../deploy.config.json', import.meta.url));
if (!existsSync(path)) {
  throw new Error(
    `No deployment config at ${path}: copy infra/deploy.config.example.json and fill it in, or ` +
      'fetch it with aws ssm get-parameter --name /<resourcePrefix>/deploy-config',
  );
}
const config = deployConfigSchema.parse(JSON.parse(readFileSync(path, 'utf8')));

export const PREFIX = config.resourcePrefix;
export const BUDGET_PROJECT = config.budgetProject;
export const ACCOUNT = config.account;
export const REGION = config.region;
export const GITHUB_REPO = config.githubRepo;
export const APP_REPO = config.appRepo;
export const GITHUB_CONNECTION_ARN = config.githubConnectionArn;
export const CERTIFICATE_ARN = config.certificateArn;
export const HOSTED_ZONE = config.hostedZone;
export const STAGES: SiteStageConfig[] = config.stages;

/** String parameter with this config, which the pipelines' synth step fetches. */
export const DEPLOY_CONFIG_PARAMETER = `/${PREFIX}/deploy-config`;

/** A domain's record name in the hosted zone; undefined for the zone's apex. */
export const zoneRecordName = (domain: string) =>
  domain === HOSTED_ZONE.zoneName ? undefined : domain.slice(0, -HOSTED_ZONE.zoneName.length - 1);

/** Physical name for a stage's resource, `<prefix>-<stage>-<parts>`. */
export const resourceName = (stage: SiteStageConfig, ...parts: string[]) =>
  [PREFIX, stage.name, ...parts].join('-');
