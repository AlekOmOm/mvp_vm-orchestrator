# Store Migration Checklist

This checklist tracks the migration of legacy stores to the dependency-injected factory pattern.

## Stores

- [x] `commandStore.js`
- [x] `jobStore.js`
- [x] `logStore.js`

## Steps

1. Extract initial state into a constant.
2. Move business logic into a `storeLogic` function that receives `(baseStore, dependencies)`.
3. Replace direct `getService` calls with injected dependencies.
4. Export `create<StoreName>Factory` using `createStoreFactory`.
5. Register the factory in `storeRegistry.js` via `registerStoreWithDependencies` with explicit service dependencies.
6. Remove legacy singleton export once components have switched to the container.
7. Update components to retrieve the store via `storesContainer.get('<storeName>')`.
8. Add minimal integration test similar to `testStoreIntegration`. 