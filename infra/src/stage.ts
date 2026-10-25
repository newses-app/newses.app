import { Aspects, Stage, type StageProps, Tags } from 'aws-cdk-lib';
import type { Construct } from 'constructs';
import {
  ACCOUNT,
  BUDGET_PROJECT,
  REGION,
  resourceName,
  type SiteStageConfig,
} from './deploy-config.ts';
import { ManagedLogGroups } from './managed-log-groups.ts';
import { SiteStack } from './site-stack.ts';

export interface SiteStageProps extends StageProps {
  stage: SiteStageConfig;
  /** Built site; defaults to `.vitepress/dist`. */
  siteDir?: string;
}

/** One deployment of the site. Tagged with the app's project, so its budget counts the site. */
export class SiteStage extends Stage {
  readonly site: SiteStack;

  constructor(scope: Construct, id: string, props: SiteStageProps) {
    super(scope, id, props);
    const { stage } = props;
    Tags.of(this).add('project', BUDGET_PROJECT);
    Tags.of(this).add('stage', stage.name);
    Aspects.of(this).add(new ManagedLogGroups());

    this.site = new SiteStack(this, 'Site', {
      env: { account: ACCOUNT, region: REGION },
      stackName: resourceName(stage, 'site'),
      stage,
      ...(props.siteDir !== undefined && { siteDir: props.siteDir }),
    });
  }
}
