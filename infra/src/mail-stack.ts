import { Stack, type StackProps } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as ses from 'aws-cdk-lib/aws-ses';
import * as actions from 'aws-cdk-lib/aws-ses-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cr from 'aws-cdk-lib/custom-resources';
import type { Construct } from 'constructs';
import {
  HOSTED_ZONE,
  resourceName,
  type SiteStageConfig,
  zoneRecordName,
} from './deploy-config.ts';

export interface MailStackProps extends StackProps {
  stage: SiteStageConfig;
  /** Addresses at the stage's domain whose mail is received. */
  addresses: string[];
}

/**
 * Receives mail for the stage's addresses with SES and publishes each message, raw MIME up to
 * 150 KB (larger mail bounces), to the `<prefix>-<stage>-mail` topic. Owns the account's active
 * receipt rule set in the region.
 */
export class MailStack extends Stack {
  readonly topic: sns.Topic;

  constructor(scope: Construct, id: string, props: MailStackProps) {
    super(scope, id, props);
    const { stage, addresses } = props;
    const zone = route53.PublicHostedZone.fromHostedZoneAttributes(this, 'Zone', HOSTED_ZONE);

    // Receiving needs the domain verified; Easy DKIM's records verify it.
    new ses.EmailIdentity(this, 'Domain', {
      identity: ses.Identity.publicHostedZone(zone),
    });
    new route53.MxRecord(this, 'Mx', {
      zone,
      recordName: zoneRecordName(stage.domainName),
      values: [{ priority: 10, hostName: `inbound-smtp.${this.region}.amazonaws.com` }],
    });

    const ruleSetName = resourceName(stage, 'mail');
    const ruleName = resourceName(stage, 'mail', 'forward');
    // Unencrypted: SES can only publish to topics encrypted with a customer managed key.
    this.topic = new sns.Topic(this, 'Topic', { topicName: resourceName(stage, 'mail') });
    this.topic.addToResourcePolicy(
      new iam.PolicyStatement({
        principals: [new iam.ServicePrincipal('ses.amazonaws.com')],
        actions: ['sns:Publish'],
        resources: [this.topic.topicArn],
        conditions: {
          StringEquals: {
            'aws:SourceAccount': this.account,
            'aws:SourceArn': `arn:${this.partition}:ses:${this.region}:${this.account}:receipt-rule-set/${ruleSetName}:receipt-rule/${ruleName}`,
          },
        },
      }),
    );

    const ruleSet = new ses.ReceiptRuleSet(this, 'RuleSet', { receiptRuleSetName: ruleSetName });
    const rule = ruleSet.addRule('Forward', {
      receiptRuleName: ruleName,
      recipients: addresses,
      scanEnabled: true,
      tlsPolicy: ses.TlsPolicy.REQUIRE,
      actions: [new actions.Sns({ topic: this.topic, encoding: actions.EmailEncoding.UTF8 })],
    });
    // SES checks it may publish when the rule is created.
    rule.node.addDependency(this.topic);

    // CloudFormation can't activate a rule set; deleting the stack deactivates it first.
    const activate: cr.AwsSdkCall = {
      service: 'SES',
      action: 'setActiveReceiptRuleSet',
      parameters: { RuleSetName: ruleSetName },
      physicalResourceId: cr.PhysicalResourceId.of(ruleSetName),
    };
    const active = new cr.AwsCustomResource(this, 'Activate', {
      onCreate: activate,
      onUpdate: activate,
      onDelete: { service: 'SES', action: 'setActiveReceiptRuleSet', parameters: {} },
      // SetActiveReceiptRuleSet has no resource-level permissions.
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
        resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
      }),
      installLatestAwsSdk: false,
    });
    active.node.addDependency(rule);
  }
}
