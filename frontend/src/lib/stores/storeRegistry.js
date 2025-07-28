// storeRegistry.js
// Registers existing store singletons with the StoresContainer.
import { storesContainer } from "./StoresContainer.js";

export function registerStores(serviceContainer) {
   registerStoreWithDependencies(
      "vmStore",
      () => import("./vmStore.js").then((m) => m.createVMStoreFactory),
      ["vmService"]
   );

   registerStoreWithDependencies(
      "commandStore",
      () =>
         import("./commandStore.js").then((m) => m.createCommandStoreFactory),
      ["commandService", "vmService"]
   );

   registerStoreWithDependencies(
      "jobStore",
      () => import("./jobStore.js").then((m) => m.createJobStoreFactory),
      ["jobService"]
   );

   registerStoreWithDependencies(
      "logStore",
      () => import("./logStore.js").then((m) => m.createLogStoreFactory),
      [] // No dependencies for logStore
   );

   function registerStoreWithDependencies(
      name,
      factoryLoader,
      serviceDeps = []
   ) {
      storesContainer.register(name, async () => {
         const factory = await factoryLoader();
         const services = {};
         serviceDeps.forEach((dep) => {
            services[dep] = serviceContainer.get(dep);
         });
         return factory(services);
      });
   }
}

export function registerLegacyStores() {
   storesContainer.register("vmStore", async () => {
      const mod = await import("./vmStore.js");
      return mod.vmStore;
   });
   storesContainer.register("commandStore", async () => {
      const mod = await import("./commandStore.js");
      return mod.commandStore;
   });
   storesContainer.register("jobStore", async () => {
      const mod = await import("./jobStore.js");
      return mod.jobStore;
   });
   storesContainer.register("logStore", async () => {
      const mod = await import("./logStore.js");
      return mod.logStore;
   });
}
