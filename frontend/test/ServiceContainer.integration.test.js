/**
 * ServiceContainer Integration Tests
 *
 * Tests to verify the ServiceContainer properly registers and provides
 * the JobWebSocketService with correct dependencies.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ServiceContainer } from "../src/lib/core/ServiceContainer.js";
import { JobWebSocketService } from "../src/lib/modules/jobs/JobWebSocketService.js";
import { WebSocketClient } from "../src/lib/core/clients/WebSocketClient.js";

describe("ServiceContainer Integration", () => {
   let container;

   beforeEach(() => {
      container = new ServiceContainer();
   });

   afterEach(() => {
      if (container.isInitialized()) {
         container.shutdown();
      }
   });

   describe("Service Registration", () => {
      it("should register jobSocketService as singleton", () => {
         expect(container.has("jobSocketService")).toBe(true);
      });

      it("should register jobsWebSocketClient as singleton", () => {
         expect(container.has("jobsWebSocketClient")).toBe(true);
      });

      it("should register apiClient as singleton", () => {
         expect(container.has("apiClient")).toBe(true);
      });
   });

   describe("Service Creation", () => {
      it("should create JobWebSocketService instance", () => {
         const service = container.get("jobSocketService");
         expect(service).toBeInstanceOf(JobWebSocketService);
      });

      it("should inject WebSocketClient dependency", () => {
         const jobService = container.get("jobSocketService");
         const wsClient = container.get("jobsWebSocketClient");

         expect(jobService.wsClient).toBe(wsClient);
         expect(wsClient).toBeInstanceOf(WebSocketClient);
      });

      it("should inject ApiClient dependency", () => {
         const jobService = container.get("jobSocketService");
         const apiClient = container.get("apiClient");

         expect(jobService.apiClient).toBe(apiClient);
      });

      it("should return same instance on multiple calls (singleton)", () => {
         const service1 = container.get("jobSocketService");
         const service2 = container.get("jobSocketService");

         expect(service1).toBe(service2);
      });
   });

   describe("Service Interface", () => {
      it("should provide expected JobWebSocketService methods", () => {
         const service = container.get("jobSocketService");

         // Core methods
         expect(typeof service.executeCommand).toBe("function");
         expect(typeof service.getIsConnected).toBe("function");
         expect(typeof service.isConnected).toBe("function");

         // Store getters
         expect(typeof service.getCurrentJob).toBe("function");
         expect(typeof service.getLogLines).toBe("function");
         expect(typeof service.getJobs).toBe("function");
         expect(typeof service.getCommands).toBe("function");
         expect(typeof service.getConnectionStatus).toBe("function");

         // Event handling
         expect(typeof service.on).toBe("function");
         expect(typeof service.emit).toBe("function");

         // Lifecycle
         expect(typeof service.disconnect).toBe("function");
      });

      it("should provide reactive stores", () => {
         const service = container.get("jobSocketService");

         const currentJob = service.getCurrentJob();
         const logLines = service.getLogLines();
         const jobs = service.getJobs();
         const commands = service.getCommands();

         // Check that stores have subscribe method (Svelte store interface)
         expect(typeof currentJob.subscribe).toBe("function");
         expect(typeof logLines.subscribe).toBe("function");
         expect(typeof jobs.subscribe).toBe("function");
         expect(typeof commands.subscribe).toBe("function");
      });
   });

   describe("Service Names", () => {
      it("should list all registered services", () => {
         const serviceNames = container.getServiceNames();

         expect(serviceNames).toContain("apiClient");
         expect(serviceNames).toContain("jobsWebSocketClient");
         expect(serviceNames).toContain("jobSocketService");
      });
   });
});
