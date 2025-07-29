/**
 * Store integration composable
 * Standardizes how components consume stores
 */

export function useStore(store, selector = (state) => state) {
  let value = $state(selector(store.getState()));
  
  $effect(() => {
    return store.subscribe(state => {
      value = selector(state);
    });
  });
  
  return {
    get value() { return value; },
    store
  };
}