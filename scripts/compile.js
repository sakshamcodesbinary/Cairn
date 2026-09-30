import { execFileSync } from 'node:child_process';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';

const compactSource = 'contracts/cairn.compact';
const managedOutput = 'contracts/managed/cairn';
const compilerVersion = '+0.31.1';
const shellQuote = (value) => `'${value.replaceAll("'", "'\\''")}'`;

function windowsPathToWsl(value) {
  const match = value.replaceAll('\\', '/').match(/^([A-Za-z]):\/(.*)$/);
  if (!match) throw new Error(`Cannot convert Windows path to WSL path: ${value}`);
  return `/mnt/${match[1].toLowerCase()}/${match[2]}`;
}

console.log(`[Cairn] Compiling real circuits and proving keys: ${compactSource}`);
try {
  if (os.platform() === 'win32') {
    const distro = process.env.MIDNIGHT_WSL_DISTRO ?? 'Ubuntu';
    const user = process.env.MIDNIGHT_WSL_USER ?? execFileSync('wsl.exe', ['-d', distro, '--', 'whoami'], { encoding: 'utf8' }).trim();
    const compiler = process.env.COMPACT_BIN ?? `/home/${user}/.local/bin/compact`;
    const command = `cd ${shellQuote(windowsPathToWsl(process.cwd()))} && ${shellQuote(compiler)} compile ${compilerVersion} ${shellQuote(compactSource)} ${shellQuote(managedOutput)}`;
    execFileSync('wsl.exe', ['-d', distro, '-u', user, '--', 'bash', '-lc', command], { stdio: 'inherit' });
  } else {
    execFileSync(process.env.COMPACT_BIN ?? 'compact', ['compile', compilerVersion, compactSource, managedOutput], { stdio: 'inherit' });
  }
  const info = JSON.parse(fs.readFileSync(path.join(managedOutput, 'compiler/contract-info.json'), 'utf8'));
  for (const circuit of info.circuits.filter((entry) => entry.proof)) {
    for (const asset of [`keys/${circuit.name}.prover`, `keys/${circuit.name}.verifier`, `zkir/${circuit.name}.bzkir`]) {
      if (fs.statSync(path.join(managedOutput, asset)).size === 0) throw new Error(`Empty generated asset: ${asset}`);
    }
    console.log(`  ${circuit.name}: proving key, verifier key and ZKIR verified`);
  }
  await import('./copy-managed.js');
} catch (error) {
  console.error('[Cairn] Compilation failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
