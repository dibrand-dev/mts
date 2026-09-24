import { ProformaStrategy } from './types';
import { vesselStrategy } from './strategies/vessel.strategy';
import { fiscalYardStrategy } from './strategies/fiscal-yard.strategy';
import { fixedDepositStrategy } from './strategies/fixed-deposit.strategy';
import { sharedExpoStrategy } from './strategies/shared-expo.strategy';
import { standardStrategy } from './strategies/standard.strategy';

const strategyMap = new Map<string, ProformaStrategy>();

// Register default strategies
export function registerStrategy(strategy: ProformaStrategy): void {
  strategyMap.set(strategy.type, strategy);
}

// Initial registration
registerStrategy(vesselStrategy);
registerStrategy(fiscalYardStrategy);
registerStrategy(fixedDepositStrategy);
registerStrategy(sharedExpoStrategy);
registerStrategy(standardStrategy);

export function getStrategy(type: string = 'vessel'): ProformaStrategy {
  const strategy = strategyMap.get(type);
  if (!strategy) {
    console.warn(`Strategy '${type}' not found, falling back to vesselStrategy.`);
    return vesselStrategy;
  }
  return strategy;
}

export function getAllStrategies(): ProformaStrategy[] {
  return Array.from(strategyMap.values());
}

/**
 * Suggests the default/most common proforma type for a client based on company name
 */
export function getDefaultStrategyForClient(clientCompanyName: string): string {
  if (!clientCompanyName) return 'vessel';
  const name = clientCompanyName.toLowerCase();

  if (name.includes('delta dock')) {
    return 'fixed_deposit';
  }
  if (name.includes('cooptacord')) {
    return 'shared_expo';
  }
  if (name.includes('danchuk')) {
    return 'standard';
  }
  if (name.includes('cat')) {
    return 'vessel';
  }
  return 'vessel';
}

