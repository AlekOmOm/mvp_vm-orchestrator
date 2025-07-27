import { SSHManager } from './ssh-manager.js';
import { serverlessAPI } from './serverless-api-client.js';

// cache of last refresh
let cache = {
  timestamp: 0,
  uuids: new Set(),
};
const CACHE_TTL = 5 * 60 * 1000; // 5 min

/**
 * Ensure all SSH hosts are present in /api/vms table
 */
export async function syncSshHostsToVms(force = false) {
  if (!force && Date.now() - cache.timestamp < CACHE_TTL) {
    return;
  }
  try {
    const hosts = SSHManager.getAllHosts();
    const backendVMs = await serverlessAPI.getVMs();
    const existingAliases = new Set(backendVMs.map((v) => v.alias || v.name));

    for (const host of hosts) {
      if (!existingAliases.has(host.alias)) {
        const payload = {
          name: host.suggestedVMName,
          host: host.config.host,
          user: host.config.user,
          environment: 'development',
          alias: host.alias,
        };
        try {
          await serverlessAPI.createVM(payload);
        } catch (_) {
          // ignore duplicate race
        }
      }
    }
    cache.timestamp = Date.now();
  } catch (err) {
    console.error('auto-register VMs failed:', err.message);
  }
} 