import type { ReleaseStage } from './contracts.js';

export const stages: readonly ReleaseStage[] = [
  'planned',
  'building',
  'verifying',
  'deploying',
  'monitoring',
  'complete',
];

export function stageIndex(stage: ReleaseStage): number {
  return stages.indexOf(stage);
}

export function stageProgress(stage: ReleaseStage): number {
  return Math.round((stageIndex(stage) / (stages.length - 1)) * 100);
}

