// Main SDK exports
export {
  initialize,
  updateUser,
  shutdown,
  checkAndExecuteExperiments,
  forceExecuteExperiment,
  createExperimentationProvider,
  createSdkScript,
} from './lib/sdk';

// React components
export {
  ExperimentationProvider,
  useExperimentation,
} from './components/ExperimentationProvider';

// Types
export type { Experiment, TargetingCondition } from './types/experiment';