/**
 * JobWebSocketService Tests
 *
 * Unit tests for the new JobWebSocketService to verify it properly wraps
 * the WebSocketClient and provides the expected interface.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { JobWebSocketService } from "../src/lib/modules/jobs/JobWebSocketService.js";

describe("JobWebSocketService", () => {
   let mockWebSocketClient;
   let mockApiClient;
   let jobSocketService;

   beforeEach(() => {
      // Create a mock WebSocketClient
      mockWebSocketClient = {
         getIsConnected: vi.fn(() => true),
         getConnectionStatus: vi.fn(() => ({ subscribe: vi.fn() })),
         on: vi.fn(),
         emit: vi.fn(),
         disconnect: vi.fn(),
      };

      // Create a mock ApiClient
      mockApiClient = {
         get: vi.fn(),
         post: vi.fn(),
         put: vi.fn(),
         delete: vi.fn(),
      };

      jobSocketService = new JobWebSocketService(
         mockWebSocketClient,
         mockApiClient
      );
   });

   describe("Initialization", () => {
      it("should initialize with WebSocketClient dependency", () => {
         expect(jobSocketService.wsClient).toBe(mockWebSocketClient);
      });

      it("should initialize with ApiClient dependency", () => {
         expect(jobSocketService.apiClient).toBe(mockApiClient);
      });

      it("should create reactive stores", () => {
         expect(jobSocketService.currentJob).toBeDefined();
         expect(jobSocketService.logLines).toBeDefined();
         expect(jobSocketService.jobs).toBeDefined();
         expect(jobSocketService.commands).toBeDefined();
      });

      it("should setup event handlers on initialization", () => {
         expect(mockWebSocketClient.on).toHaveBeenCalledWith(
            "job:started",
            expect.any(Function)
         );
         expect(mockWebSocketClient.on).toHaveBeenCalledWith(
            "job:log",
            expect.any(Function)
         );
         expect(mockWebSocketClient.on).toHaveBeenCalledWith(
            "job:done",
            expect.any(Function)
         );
         expect(mockWebSocketClient.on).toHaveBeenCalledWith(
            "job:error",
            expect.any(Function)
         );
      });
   });

   describe("Connection Status", () => {
      it("should delegate getIsConnected to WebSocketClient", () => {
         const result = jobSocketService.getIsConnected();
         expect(mockWebSocketClient.getIsConnected).toHaveBeenCalled();
         expect(result).toBe(true);
      });

      it("should provide legacy isConnected method", () => {
         const result = jobSocketService.isConnected();
         expect(result).toBe(true);
      });

      it("should delegate getConnectionStatus to WebSocketClient", () => {
         jobSocketService.getConnectionStatus();
         expect(mockWebSocketClient.getConnectionStatus).toHaveBeenCalled();
      });
   });

   describe("Command Execution", () => {
      it("should execute command when connected", () => {
         const commandData = {
            command: "ls -la",
            type: "stream",
            hostAlias: "test-host",
            vmId: "vm-123",
         };

         jobSocketService.executeCommand(commandData);
         expect(mockWebSocketClient.emit).toHaveBeenCalledWith(
            "execute-command",
            commandData
         );
      });

      it("should handle legacy string command format", () => {
         const command = "ls -la";
         jobSocketService.executeCommand(command);
         expect(mockWebSocketClient.emit).toHaveBeenCalledWith(
            "execute-command",
            command
         );
      });

      it("should throw error when not connected", () => {
         mockWebSocketClient.getIsConnected.mockReturnValue(false);

         expect(() => {
            jobSocketService.executeCommand("test command");
         }).toThrow("WebSocket not connected");
      });

      it("should validate command object format", () => {
         expect(() => {
            jobSocketService.executeCommand({});
         }).toThrow("Command is required");
      });
   });

   describe("Store Getters", () => {
      it("should provide getCurrentJob getter", () => {
         const result = jobSocketService.getCurrentJob();
         expect(result).toBe(jobSocketService.currentJob);
      });

      it("should provide getLogLines getter", () => {
         const result = jobSocketService.getLogLines();
         expect(result).toBe(jobSocketService.logLines);
      });

      it("should provide getJobs getter", () => {
         const result = jobSocketService.getJobs();
         expect(result).toBe(jobSocketService.jobs);
      });

      it("should provide getCommands getter", () => {
         const result = jobSocketService.getCommands();
         expect(result).toBe(jobSocketService.commands);
      });
   });

   describe("Event Handling", () => {
      it("should allow adding custom event handlers", () => {
         const handler = vi.fn();
         jobSocketService.on("test-event", handler);

         jobSocketService.triggerEventHandlers("test-event", { data: "test" });
         expect(handler).toHaveBeenCalledWith({ data: "test" });
      });

      it("should handle errors in event handlers gracefully", () => {
         const errorHandler = vi.fn(() => {
            throw new Error("Handler error");
         });

         jobSocketService.on("test-event", errorHandler);

         // Should not throw
         expect(() => {
            jobSocketService.triggerEventHandlers("test-event", {});
         }).not.toThrow();
      });
   });

   describe("Delegation Methods", () => {
      it("should delegate emit to WebSocketClient", () => {
         jobSocketService.emit("test-event", { data: "test" });
         expect(mockWebSocketClient.emit).toHaveBeenCalledWith("test-event", {
            data: "test",
         });
      });

      it("should delegate disconnect to WebSocketClient", () => {
         jobSocketService.disconnect();
         expect(mockWebSocketClient.disconnect).toHaveBeenCalled();
      });
   });
});
