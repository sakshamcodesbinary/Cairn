import { type MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { type CairnPrivateState } from '../contracts/index.js';
import { type MidnightWalletProvider } from './wallet.js';
import { type NetworkConfig } from './config.js';

export type CairnCircuits = 'prove_access' | 'update_gate' | 'set_gate_open';
export type CairnProviders = MidnightProviders<CairnCircuits, string, CairnPrivateState>;

export function buildProviders(
  wallet: MidnightWalletProvider,
  zkConfigPath: string,
  config: NetworkConfig,
): CairnProviders {
  const password = process.env['CAIRN_PRIVATE_STORAGE_PASSWORD'];
  if (!password || password.length < 16) {
    throw new Error('CAIRN_PRIVATE_STORAGE_PASSWORD must contain at least 16 characters. Keep it private and back it up.');
  }
  const zkConfigProvider = new NodeZkConfigProvider<CairnCircuits>(zkConfigPath);
  return {
    privateStateProvider: levelPrivateStateProvider<string, CairnPrivateState>({
      privateStateStoreName: `cairn-${config.networkId}`,
      privateStoragePasswordProvider: () => password,
      accountId: wallet.getCoinPublicKey(),
    }),
    publicDataProvider: indexerPublicDataProvider(config.indexer, config.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(config.proofServer, zkConfigProvider),
    walletProvider: wallet,
    midnightProvider: wallet,
  };
}
