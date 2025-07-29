import { createBaseStore } from './crudStore.js';

export function createStoreFactory(storeName, initialState, storeLogic) {
   return function storeFactory(dependencies = {}) {
      const baseStore = createBaseStore(initialState, { name: storeName, enableLogging: true }, dependencies);
      return { ...baseStore, ...storeLogic(baseStore, dependencies) };
   };
}