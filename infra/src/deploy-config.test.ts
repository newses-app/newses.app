import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { deployConfigSchema } from './deploy-config.ts';

const example = JSON.parse(
  readFileSync(new URL('../deploy.config.example.json', import.meta.url), 'utf8'),
) as { stages: Record<string, unknown>[] } & Record<string, unknown>;
const [dev, prod] = example.stages;
const withProd = (changes: Record<string, unknown>) =>
  deployConfigSchema.safeParse({ ...example, stages: [dev, { ...prod, ...changes }] });

describe('deploy config', () => {
  it('accepts the example, with the apex and www in the zone', () => {
    expect(deployConfigSchema.safeParse(example).success).toBe(true);
  });

  it('refuses domains outside the zone, and repeated ones', () => {
    expect(withProd({ domainName: 'example.org' }).success).toBe(false);
    expect(withProd({ redirectFrom: ['www.example.org'] }).success).toBe(false);
    expect(withProd({ redirectFrom: ['dev.example.com'] }).success).toBe(false);
  });

  it("receives email only at the stage's domain, on one stage", () => {
    expect(withProd({ inboundEmail: { addresses: ['conduct@example.org'] } }).success).toBe(false);
    expect(withProd({ inboundEmail: { addresses: ['conduct@dev.example.com'] } }).success).toBe(
      false,
    );
    const both = deployConfigSchema.safeParse({
      ...example,
      stages: [{ ...dev, inboundEmail: { addresses: ['conduct@dev.example.com'] } }, prod],
    });
    expect(both.success).toBe(false);
  });

  it('needs an HTTPS downloads folder', () => {
    expect(withProd({ downloadsUrl: 'http://reader.example.com/downloads/' }).success).toBe(false);
    expect(withProd({ downloadsUrl: 'https://reader.example.com/downloads' }).success).toBe(false);
  });
});
