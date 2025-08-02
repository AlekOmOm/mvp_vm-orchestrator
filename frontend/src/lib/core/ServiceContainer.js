/**
 * Service Container
 *
 * Dependency injection container for managing service instances.
 * Provides centralized service creation and lifecycle management.
 *
 * @fileoverview Dependency injection container for services
 */

import { ApiClient } from "./clients/ApiClient.js";
import { WebSocketClient } from "./clients/WebSocketClient.js";
import { JobWebSocketService } from "../modules/jobs/JobWebSocketService.js";
import { VMService } from "../modules/vm/services/VMService.js";
import { SshHostService } from "../modules/ssh/services/SshHostService.js";
import { VmsService } from "../modules/vms/services/VmsService.js";
import { CommandService } from "../modules/commands/CommandService.js";
import { JobService } from "../modules/jobs/services/JobService.js";
import { CommandExecutor } from "./services/CommandExecutor.js";
import { LogService } from "../modules/logs/logService.js";
import { writable } from "svelte/store";

/**
 * Service Container class
 *
 * Manages service instances and their dependencies.
 * Implements singleton pattern for shared services.
 */
export class ServiceContainer {
   constructor() {
      this.services = new Map();
      this.singletons = new Map();
      this.factories = new Map();
      this.initialized = false;

      this.registerDefaultServices();
   }

   /**
    * Register default services
    */
   registerDefaultServices() {
      this.registerSingleton("apiClient", () => new ApiClient());
      this.registerSingleton(
         "sshHostService",
         (c) => new SshHostService(c.get("apiClient"))
      );
      this.registerSingleton(
         "vmsService",
         (c) => new VmsService(c.get("apiClient"))
      );
      this.registerSingleton(
         "commandService",
         (c) => new CommandService(c.get("apiClient"))
      );
      this.registerSingleton(
         "jobsWebSocketClient",
         () => new WebSocketClient("/jobs")
      );
      this.registerSingleton(
         "jobSocketService",
         (c) =>
            new JobWebSocketService(
               c.get("jobsWebSocketClient"),
               c.get("apiClient")
            )
      );
      this.registerSingleton(
         "jobService",
         (c) => new JobService(c.get("jobSocketService"), c.get("apiClient"))
      );
      this.registerSingleton(
         "vmService",
         (c) =>
            new VMService(
               c.get("sshHostService"),
               c.get("vmsService"),
               c.get("jobsWebSocketClient")
            )
      );
      this.registerSingleton(
         "commandExecutor",
         (c) => new CommandExecutor(c.get("jobService"), c.get("vmService"))
      );
      // Backward compatibility alias
      this.registerSingleton("commandExecutionService", (c) =>
         c.get("commandExecutor")
      );
      this.registerSingleton(
         "logService",
         (c) => new LogService(c.get("apiClient"))
      );
   }

   /**
    * Register a singleton service
    * @param {string} name - Service name
    * @param {Function} factory - Factory function
    */
   registerSingleton(name, factory) {
      this.singletons.set(name, { factory, instance: null });
   }

   /**
    * Register a factory service (new instance each time)
    * @param {string} name - Service name
    * @param {Function} factory - Factory function
    */
   registerFactory(name, factory) {
      this.factories.set(name, factory);
   }

   /**
    * Register a service instance
    * @param {string} name - Service name
    * @param {any} instance - Service instance
    */
   registerInstance(name, instance) {
      this.services.set(name, instance);
   }

   /**
    * Get service instance
    * @param {string} name - Service name
    * @returns {any} Service instance
    */
   get(name) {
      // Check for direct instance first
      if (this.services.has(name)) {
         return this.services.get(name);
      }

      // Check for singleton
      if (this.singletons.has(name)) {
         const singleton = this.singletons.get(name);
         if (!singleton.instance) {
            singleton.instance = singleton.factory(this);
         }
         return singleton.instance;
      }

      // Check for factory
      if (this.factories.has(name)) {
         const factory = this.factories.get(name);
         return factory(this);
      }

      throw new Error(`Service '${name}' not found`);
   }

   /**
    * Check if service is registered
    * @param {string} name - Service name
    * @returns {boolean} True if service is registered
    */
   has(name) {
      return (
         this.services.has(name) ||
         this.singletons.has(name) ||
         this.factories.has(name)
      );
   }

   /**
    * Initialize all singleton services
    */
   async initialize() {
      if (this.initialized) {
         console.log("⚠️ Service container already initialized");
         return;
      }

      console.log("🚀 Initializing service container...");

      try {
         // Initialize core clients
         const apiClient = this.get("apiClient");
         const wsClient = this.get("jobsWebSocketClient");

         // Initialize job socket service BEFORE connecting to ensure it receives core:connected event
         const jobSocketService = this.get("jobSocketService");
         const jobService = this.get("jobService");

         // Connect WebSocket
         wsClient.connect();

         // Wait for WebSocket connection (with timeout)
         await this.waitForWebSocketConnection(wsClient, 10000);

         // Connect jobStore to jobService for real-time updates
         const { getJobStore } = await import("$lib/state/stores.state.svelte.js");
         const jobStore = getJobStore();
         if (jobStore) {
            jobService.setJobStore(jobStore);
            console.log("🔗 Connected jobStore to jobService");
         }

         this.initialized = true;
         console.log("✅ Service container initialized");

         // Update health state reactively
         serviceHealth.update((health) => ({
            ...health,
            apiClient: "connected",
            jobService: wsClient.getIsConnected()
               ? "connected"
               : "disconnected",
         }));
      } catch (error) {
         console.error("❌ Failed to initialize service container:", error);
         throw error;

         // Update health state reactively
         serviceHealth.update((health) => ({
            ...health,
            apiClient: "error",
            jobService: "error",
         }));
      }
   }

   /**
    * Wait for WebSocket connection
    * @param {WebSocketClient} wsClient - WebSocket client
    * @param {number} timeout - Timeout in milliseconds
    * @returns {Promise} Promise that resolves when connected
    */
   waitForWebSocketConnection(wsClient, timeout = 10000) {
      return new Promise((resolve, reject) => {
         const timeoutId = setTimeout(() => {
            unsubscribe();
            reject(new Error("WebSocket connection timeout"));
         }, timeout);

         const unsubscribe = wsClient
            .getConnectionStatus()
            .subscribe((status) => {
               if (status === "connected") {
                  clearTimeout(timeoutId);
                  unsubscribe();
                  resolve();
               } else if (status === "error") {
                  clearTimeout(timeoutId);
                  unsubscribe();
                  reject(new Error("WebSocket connection failed"));
               }
            });
      });
   }

   /**
    * Shutdown all services
    */
   async shutdown() {
      console.log("🛑 Shutting down service container...");

      try {
         // Disconnect WebSocket clients
         if (this.has("jobsWebSocketClient")) {
            const wsClient = this.get("jobsWebSocketClient");
            wsClient.disconnect();
         }

         // Clear all instances
         this.services.clear();
         this.singletons.forEach((singleton) => {
            singleton.instance = null;
         });

         this.initialized = false;
         console.log("✅ Service container shut down");
      } catch (error) {
         console.error("❌ Error during service container shutdown:", error);
      }
   }

   /**
    * Get all registered service names
    * @returns {Array<string>} List of service names
    */
   getServiceNames() {
      const names = new Set();

      this.services.forEach((_, name) => names.add(name));
      this.singletons.forEach((_, name) => names.add(name));
      this.factories.forEach((_, name) => names.add(name));

      return Array.from(names);
   }

   /**
    * Check if container is initialized
    * @returns {boolean} True if initialized
    */
   isInitialized() {
      return this.initialized;
   }

   /**
    * Reset container (for testing)
    */
   reset() {
      this.shutdown();
      this.services.clear();
      this.singletons.clear();
      this.factories.clear();
      this.initialized = false;
      this.registerDefaultServices();
   }
}

/**
 * Global service container instance
 */
export const serviceContainer = new ServiceContainer();

/**
 * Helper function to get service from global container
 * @param {string} serviceName - Name of service to get
 * @returns {any} Service instance
 */
export function getService(serviceName) {
   return serviceContainer.get(serviceName);
}

/**
 * Helper function to initialize global container
 * @returns {Promise} Promise that resolves when initialized
 */
export async function initializeServices() {
   if (serviceContainer.isInitialized()) return;
   await serviceContainer.initialize();
}

/**
 * Helper function to shutdown global container
 * @returns {Promise} Promise that resolves when shut down
 */
export function shutdownServices() {
   return serviceContainer.shutdown();
}

// ✅ ADD: Reactive service health monitoring
export const serviceHealth = writable({
   apiClient: "disconnected",
   jobService: "disconnected",
   vmService: "ready",
});
