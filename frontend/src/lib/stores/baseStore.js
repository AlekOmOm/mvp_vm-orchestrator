/**
 * Base Store Pattern
 *
 * Provides common functionality for all stores including:
 * - Loading state management
 * - Error handling
 * - Reset functionality
 * - Consistent state patterns
 *
 * Follows Svelte store best practices with reactive patterns.
 */

import { writable, derived } from "svelte/store";

/**
 * Create a base store with common functionality
 * @param {Object} initialState - Initial state object
 * @param {Object} options - Configuration options
 * @returns {Object} Store with common methods
 */
export function createBaseStore(initialState, options = {}) {
   const { name = "BaseStore", enableLogging = false } = options;

   // Core writable store
   const { subscribe, set, update } = writable(initialState);

   // Helper function for logging
   function log(message, data = null) {
      if (enableLogging) {
         console.log(`[${name}] ${message}`, data || "");
      }
   }

   return {
      subscribe,
      update, // Expose raw update method for direct state updates

      /**
       * Set loading state
       * @param {boolean} loading - Loading state
       */
      setLoading(loading) {
         log(`Setting loading: ${loading}`);
         update((state) => ({ ...state, loading }));
      },

      /**
       * Set error state
       * @param {string|Error|null} error - Error message or Error object
       */
      setError(error) {
         const errorMessage = error instanceof Error ? error.message : error;
         log(`Setting error: ${errorMessage}`);
         update((state) => ({
            ...state,
            error: errorMessage,
            loading: false, // Stop loading on error
         }));
      },

      /**
       * Clear error state
       */
      clearError() {
         log("Clearing error");
         update((state) => ({ ...state, error: null }));
      },

      /**
       * Set both loading and error states
       * @param {boolean} loading - Loading state
       * @param {string|Error|null} error - Error state
       */
      setLoadingAndError(loading, error = null) {
         const errorMessage = error instanceof Error ? error.message : error;
         log(`Setting loading: ${loading}, error: ${errorMessage}`);
         update((state) => ({
            ...state,
            loading,
            error: errorMessage,
         }));
      },

      /**
       * Update state with loading management
       * @param {Function} updateFn - Function to update state
       * @param {boolean} setLoading - Whether to manage loading state
       */
      updateWithLoading(updateFn, setLoading = true) {
         if (setLoading) {
            this.setLoading(true);
         }

         try {
            update((state) => {
               const newState = updateFn(state);
               return setLoading ? { ...newState, loading: false } : newState;
            });
         } catch (error) {
            this.setError(error);
         }
      },

      /**
       * Reset store to initial state
       */
      reset() {
         log("Resetting store");
         set(initialState);
      },

      /**
       * Get current state value (synchronous)
       * Note: Use sparingly, prefer reactive subscriptions
       */
      getValue() {
         let value;
         const unsubscribe = subscribe((v) => (value = v));
         unsubscribe();
         return value;
      },

      /**
       * Update state directly
       * @param {Object|Function} newState - New state or update function
       */
      setState(newState) {
         if (typeof newState === "function") {
            update(newState);
         } else {
            update((state) => ({ ...state, ...newState }));
         }
      },
   };
}

/**
 * Create derived stores for common patterns
 * @param {Object} store - Base store
 * @returns {Object} Derived stores
 */
export function createDerivedStores(store) {
   return {
      loading: derived(store, ($store) => $store.loading),
      error: derived(store, ($store) => $store.error),
      hasError: derived(store, ($store) => !!$store.error),
      isReady: derived(store, ($store) => !$store.loading && !$store.error),
   };
}

/**
 * Async operation wrapper with automatic loading/error management
 * @param {Object} store - Store instance
 * @param {Function} operation - Async operation to execute
 * @param {Object} options - Options
 * @returns {Promise} Operation result
 */
export async function withLoadingState(store, operation, options = {}) {
   const {
      clearErrorFirst = true,
      logOperation = false,
      operationName = "operation",
   } = options;

   if (clearErrorFirst) {
      store.clearError();
   }

   store.setLoading(true);

   if (logOperation) {
      console.log(`Starting ${operationName}...`);
   }

   try {
      const result = await operation();
      store.setLoading(false);

      if (logOperation) {
         console.log(`${operationName} completed successfully`);
      }

      return result;
   } catch (error) {
      store.setError(error);

      if (logOperation) {
         console.error(`${operationName} failed:`, error);
      }

      throw error;
   }
}

/**
 * Create a collection store for managing arrays of items
 * @param {Array} initialItems - Initial items array
 * @param {Object} options - Configuration options
 * @returns {Object} Collection store with CRUD methods
 */
export function createCollectionStore(initialItems = [], options = {}) {
   const initialState = {
      items: initialItems,
      loading: false,
      error: null,
      ...options.additionalState,
   };

   const baseStore = createBaseStore(initialState, options);
   const { subscribe, updateWithLoading } = baseStore;

   return {
      ...baseStore,

      /**
       * Add item to collection
       * @param {*} item - Item to add
       */
      addItem(item) {
         updateWithLoading(
            (state) => ({
               ...state,
               items: [...state.items, item],
            }),
            false
         );
      },

      /**
       * Remove item from collection
       * @param {Function|*} predicate - Predicate function or item to remove
       */
      removeItem(predicate) {
         const filterFn =
            typeof predicate === "function"
               ? (item) => !predicate(item)
               : (item) => item !== predicate;

         updateWithLoading(
            (state) => ({
               ...state,
               items: state.items.filter(filterFn),
            }),
            false
         );
      },

      /**
       * Update item in collection
       * @param {Function} predicate - Function to find item
       * @param {Object|Function} updates - Updates to apply
       */
      updateItem(predicate, updates) {
         updateWithLoading(
            (state) => ({
               ...state,
               items: state.items.map((item) => {
                  if (predicate(item)) {
                     return typeof updates === "function"
                        ? updates(item)
                        : { ...item, ...updates };
                  }
                  return item;
               }),
            }),
            false
         );
      },

      /**
       * Set entire items array
       * @param {Array} items - New items array
       */
      setItems(items) {
         updateWithLoading(
            (state) => ({
               ...state,
               items: Array.isArray(items) ? items : [],
            }),
            false
         );
      },

      /**
       * Get derived stores for items
       */
      getDerivedStores() {
         return {
            ...createDerivedStores({ subscribe }),
            items: derived({ subscribe }, ($store) => $store.items),
            itemCount: derived({ subscribe }, ($store) => $store.items.length),
            hasItems: derived(
               { subscribe },
               ($store) => $store.items.length > 0
            ),
         };
      },
   };
}
