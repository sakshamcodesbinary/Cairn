import fs from 'node:fs';
import path from 'node:path';
import pino from 'pino';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';
import type { EnvironmentConfiguration } from '@midnight-ntwrk/testkit-js';

import { getConfig } from '../src/config.js';
import { MidnightWalletProvider, syncWallet, type WalletSecret } from '../src/wallet.js';
import { buildProviders } from '../src/providers.js';
import { CompiledCairnContract, Contract, pureCircuits, zkConfigPath, type CairnPrivateState } from '../contracts/index.js';

const logger = pino({
  level: process.env['LOG_LEVEL'] ?? 'info',
  transport: { target: 'pino-pretty' },
});

const network = process.env['MIDNIGHT_NETWORK'];
if (network !== 'preview' && network !== 'preprod') {
  throw new Error('Deployment requires MIDNIGHT_NETWORK=preview or preprod explicitly.');
}
const PRIVATE_STATE_ID = 'CairnDeploymentState';
const config = getConfig();

function resolveSecret(net: string): WalletSecret {
  const upper = net.toUpperCase();
  const mnemonic = process.env[`MIDNIGHT_${upper}_MNEMONIC`]?.trim().replace(/\s+/g, ' ');
  const seed = process.env[`MIDNIGHT_${upper}_SEED`]?.trim();
  if (mnemonic && seed) throw new Error(`Set only one Midnight ${net} wallet secret.`);
  if (mnemonic) return { kind: 'mnemonic', value: mnemonic };
  if (seed) return { kind: 'seed', value: seed };
  throw new Error(`Set MIDNIGHT_${upper}_MNEMONIC or MIDNIGHT_${upper}_SEED.`);
}

function bytes32FromText(value: string): Uint8Array {
  const encoded = new TextEncoder().encode(value);
  if (encoded.length > 32) throw new Error('Gate name must be 32 UTF-8 bytes or fewer.');
  const result = new Uint8Array(32);
  result.set(encoded);
  return result;
}

function bytes32FromEnv(name: string): Uint8Array {
  const value = process.env[name]?.trim().replace(/^0x/i, '');
  if (!value || !/^[0-9a-fA-F]{64}$/.test(value)) {
    throw new Error(`${name} must be set to exactly 64 hexadecimal characters.`);
  }
  const bytes = new Uint8Array(32);
  for (let index = 0; index < value.length; index += 2) {
    bytes[index / 2] = Number.parseInt(value.slice(index, index + 2), 16);
  }
  return bytes;
}

async function main() {
  setNetworkId(config.networkId);
  const environment: EnvironmentConfiguration = {
    walletNetworkId: config.networkId,
    networkId: config.networkId,
    indexer: config.indexer,
    indexerWS: config.indexerWS,
    node: config.node,
    nodeWS: config.nodeWS,
    faucet: config.faucet,
    proofServer: config.proofServer,
  };

  const memberSecret = bytes32FromEnv('CAIRN_MEMBER_SECRET_HEX');
  const adminSecret = bytes32FromEnv('CAIRN_ADMIN_SECRET_HEX');
  const gateName = process.env['CAIRN_GATE_NAME']?.trim() || 'Cairn';
  const memberClearance = BigInt(process.env['CAIRN_MEMBER_CLEARANCE'] ?? '3');
  const minimumClearance = BigInt(process.env['CAIRN_MINIMUM_CLEARANCE'] ?? '2');
  const maxEntries = BigInt(process.env['CAIRN_MAX_ENTRIES'] ?? '250');
  if (minimumClearance < 0n || minimumClearance > 255n || memberClearance < minimumClearance || memberClearance > 255n) {
    throw new Error('Clearance must satisfy 0 <= minimum <= member <= 255.');
  }
  if (maxEntries < 1n || maxEntries > 4294967295n) throw new Error('Capacity must be between 1 and 4294967295.');
  const nameBytes = bytes32FromText(gateName);
  if ((process.env['CAIRN_PRIVATE_STORAGE_PASSWORD']?.length ?? 0) < 16) {
    throw new Error('Set CAIRN_PRIVATE_STORAGE_PASSWORD to at least 16 characters.');
  }
  const wallet = await MidnightWalletProvider.build(logger, environment, resolveSecret(config.networkId));
  await wallet.start();

  try {
    await syncWallet(logger, wallet.wallet, 60 * 60_000);
    const providers = buildProviders(wallet, zkConfigPath, config);
    const deployed = await deployContract<Contract<CairnPrivateState>>(providers, {
      compiledContract: CompiledCairnContract,
      privateStateId: PRIVATE_STATE_ID,
      initialPrivateState: { memberSecret, memberClearance, adminSecret },
      args: [
        nameBytes,
        pureCircuits.derive_member_key(memberSecret, memberClearance),
        minimumClearance,
        maxEntries,
        pureCircuits.derive_admin_key(adminSecret),
      ],
    });

    const address = deployed.deployTxData.public.contractAddress;
    logger.info(`Cairn gate deployed to ${network}: ${address}`);
    const outputPath = path.resolve('contracts', 'managed', `${network}-address.txt`);
    fs.writeFileSync(outputPath, `${address}\n`);
    logger.info(`Address saved to ${outputPath}`);
  } finally {
    await wallet.stop();
  }
}

main().catch((error) => {
  logger.error(error);
  process.exitCode = 1;
});
