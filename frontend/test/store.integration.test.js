import { describe, it, expect } from 'vitest'
import { storesContainer } from '../src/lib/stores/StoresContainer.js'
import { registerStores } from '../src/lib/stores/storeRegistry.js'
import { serviceContainer } from '../src/lib/core/ServiceContainer.js'

// stub dependencies
serviceContainer.register('vmService', {
  loadVMs: async () => [],
  testConnection: async () => true,
  ensureRegistered: async (id) => ({ id }),
})
serviceContainer.register('commandService', {
  listVMCommands: async () => [],
  getTemplates: async () => ({}),
  createCommand: async () => ({}),
  updateCommand: async () => ({}),
  deleteCommand: async () => ({}),
})
serviceContainer.register('jobService', {
  fetchJobs: async () => [],
  fetchVMJobs: async () => [],
  fetchJobLogs: async () => [],
})
serviceContainer.register('logService', {})

registerStores(serviceContainer)


describe('StoresContainer integration', () => {
  it('resolves vmStore and loads VMs', async () => {
    await storesContainer.initialize()
    const vmStore = await storesContainer.get('vmStore')
    expect(vmStore).toBeDefined()
    await vmStore.loadVMs()
    expect(vmStore.getValue().vms.length).toBe(0)
  })
}) 