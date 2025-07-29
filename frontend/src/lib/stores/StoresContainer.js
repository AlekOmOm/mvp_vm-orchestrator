// StoresContainer.js
// Minimalistic centralized store container
import { writable } from "svelte/store";

class StoresContainer {
   constructor() {
      this._factories = new Map();
      this._instances = new Map();
      this._initialized = false;
   }

   register(name, factory) {
      if (this._factories.has(name)) {
         return;
      }
      this._factories.set(name, factory);
   }

   async get(name) {
      if (this._instances.has(name)) return this._instances.get(name);
      const factory = this._factories.get(name);
      if (!factory) {
         // Wait a bit and retry once in case of timing issues
         await new Promise((resolve) => setTimeout(resolve, 100));
         const retryFactory = this._factories.get(name);
         if (!retryFactory) {
            throw new Error(
               `[StoresContainer] store '${name}' not registered. Available stores: ${Array.from(
                  this._factories.keys()
               ).join(", ")}`
            );
         }
         const instance = await retryFactory();
         this._instances.set(name, instance);
         return instance;
      }
      const instance = await factory(); // Support async
      this._instances.set(name, instance);
      return instance;
   }

   async initialize() {
      if (this._initialized) return;
      for (const [name] of this._factories) {
         const store = await this.get(name);
         if (store.initialize) {
            try {
               await store.initialize();
            } catch (err) {
               console.error(
                  `[StoresContainer] failed to init '${name}':`,
                  err
               );
            }
         }
      }
      this._initialized = true;
   }
}

export const storesContainer = new StoresContainer();

export function getStore(name) {
   return storesContainer.get(name);
}

export const storeHealth = writable({});
