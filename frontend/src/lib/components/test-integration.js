import { storesContainer } from '../stores/StoresContainer.js'

export async function testStoreIntegration() {
  try {
    const vmStore = await storesContainer.get('vmStore')
    await vmStore.loadVMs()
    console.log('vmStore integration ok')
    return true
  } catch (error) {
    console.error('Store integration failed', error)
    return false
  }
} 