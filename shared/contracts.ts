import { z } from 'zod';

export const releaseStageSchema = z.enum([
  'planned',
  'building',
  'verifying',
  'deploying',
  'monitoring',
  'complete',
]);

export type ReleaseStage = z.infer<typeof releaseStageSchema>;

export const releaseSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  service: z.string().min(1),
  owner: z.string().min(1),
  stage: releaseStageSchema,
  progress: z.number().int().min(0).max(100),
  version: z.number().int().positive(),
  risk: z.enum(['low', 'moderate', 'high']),
  environment: z.enum(['preview', 'canary', 'production']),
  changedAt: z.string().datetime(),
  changedBy: z.string().min(1),
});

export type Release = z.infer<typeof releaseSchema>;

export const commandSchema = z.discriminatedUnion('type', [
  z.object({
    id: z.string().uuid(),
    releaseId: z.string().min(1),
    type: z.literal('move_stage'),
    payload: z.object({ stage: releaseStageSchema }).strict(),
    actor: z.string().min(1),
    createdAt: z.string().datetime(),
    scenarioSequence: z.number().int().positive(),
  }).strict(),
  z.object({
    id: z.string().uuid(),
    releaseId: z.string().min(1),
    type: z.literal('set_progress'),
    payload: z.object({ progress: z.number().int().min(0).max(100) }).strict(),
    actor: z.string().min(1),
    createdAt: z.string().datetime(),
    scenarioSequence: z.number().int().positive(),
  }).strict(),
  z.object({
    id: z.string().uuid(),
    releaseId: z.string().min(1),
    type: z.literal('assign_owner'),
    payload: z.object({ owner: z.string().min(1).max(80) }).strict(),
    actor: z.string().min(1),
    createdAt: z.string().datetime(),
    scenarioSequence: z.number().int().positive(),
  }).strict(),
]);

export type ReleaseCommand = z.infer<typeof commandSchema>;

export const chaosProfileSchema = z
  .object({
    seed: z.number().int().min(1).max(999_999),
    minLatencyMs: z.number().int().min(0).max(8_000),
    maxLatencyMs: z.number().int().min(0).max(8_000),
    failureRate: z.number().min(0).max(1),
    conflictRate: z.number().min(0).max(1),
  })
  .strict()
  .superRefine((profile, context) => {
    if (profile.maxLatencyMs < profile.minLatencyMs) {
      context.addIssue({
        code: 'custom',
        path: ['maxLatencyMs'],
        message: 'Maximum latency must be greater than or equal to minimum latency.',
      });
    }
    if (profile.failureRate + profile.conflictRate > 1) {
      context.addIssue({
        code: 'custom',
        path: ['conflictRate'],
        message: 'Failure and conflict probabilities cannot exceed one.',
      });
    }
  });

export type ChaosProfile = z.infer<typeof chaosProfileSchema>;

export interface Snapshot {
  releases: Release[];
  chaos: ChaosProfile;
  serverTime: string;
}

export type ApiProblemCode =
  | 'invalid_command'
  | 'missing_idempotency_key'
  | 'missing_precondition'
  | 'release_not_found'
  | 'version_conflict'
  | 'idempotency_conflict'
  | 'scenario_reset'
  | 'transient_failure';

export interface ApiProblem {
  code: ApiProblemCode;
  message: string;
  retryable: boolean;
  latest?: Release;
}
