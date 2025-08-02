/**
 * VM Service
 *
 * Business logic service for VM management operations.
 * Handles VM discovery, connection testing, and state management.
 *
 * @fileoverview VM business logic service
 */

import { ApiError } from "../../../core/clients/ApiClient.js";

/**
 * VM Service class
 *
 * Encapsulates all VM-related business logic and API interactions.
 * Uses dependency injection for API and WebSocket clients.
 */
export class VMService {
   constructor(sshHostService, vmsService, wsClient = null) {
      this.ssh = sshHostService;
      this.vms = vmsService;
      this.ws = wsClient;

      // Cache for VM data
      this.vmCache = new Map();
      this.lastRefresh = null;
      this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
   }

   /**
    * Load all VMs from SSH host discovery
    * @param {boolean} forceRefresh - Force refresh from server
    * @returns {Promise<Array>} List of VMs
    */
   async loadVMs(forceRefresh = false) {
      // Check cache first
      if (!forceRefresh && this.isValidCache()) {
         return Array.from(this.vmCache.values());
      }

      try {
         console.log("🔍 Loading VMs from SSH discovery...");

         // Get SSH hosts from backend
         const sshHosts = await this.ssh.listHosts(); // correct

         // Transform SSH hosts to VM format
         const vms = sshHosts.map((host) => this.transformSSHHostToVM(host));

         // Update cache
         this.updateCache(vms);

         console.log(`✅ Loaded ${vms.length} VMs`);
         return vms;
      } catch (error) {
         console.error("Failed to load VMs:", error);
         throw new VMServiceError("Failed to load VMs", error);
      }
   }

   /**
    * Get VM by ID
    * @param {string} vmId - VM ID (alias)
    * @returns {Promise<Object|null>} VM object or null if not found
    */
   async getVM(vmId) {
      try {
         // Check cache first
         if (this.vmCache.has(vmId)) {
            return this.vmCache.get(vmId);
         }

         // Load from server
         const sshHost = await this.ssh.getHost(vmId);
         const vm = this.transformSSHHostToVM(sshHost);

         // Update cache
         this.vmCache.set(vmId, vm);

         return vm;
      } catch (error) {
         if (error instanceof ApiError && error.status === 404) {
            return null;
         }
         throw new VMServiceError(`Failed to get VM ${vmId}`, error);
      }
   }

   /**
    * Ensure VM is registered in backend /api/vms table. If not present, create it
    * using SSH host data and return the backend VM object (with uuid id).
    * @param {string} alias - SSH alias (vmId in UI prior to registration)
    * @returns {Promise<Object>} backend VM record
    */
   async ensureRegistered(alias) {
      console.log("🔍 VMService.ensureRegistered called with alias:", alias);

      // First try to fetch VM from backend list
      try {
         const backendVMs = await this.vms.listVMs();
         const existing = backendVMs.find(
            (vm) => vm.alias === alias || vm.name === alias
         );
         if (existing) {
            console.log("✅ Found existing VM:", existing);
            return existing;
         }
         console.log("⚠️ VM not found in backend, will create...");
      } catch (error) {
         console.error("❌ Failed to list VMs:", error);
      }

      // Attempt to get SSH host details from cache or API
      let sshHost = null;
      if (this.vmCache.has(alias)) {
         // Cached VM derived from SSH hosts
         const cached = this.vmCache.get(alias);
         sshHost = {
            alias: cached.alias,
            hostname: cached.host,
            user: cached.user,
            description: cached.description,
            suggestedVMName: cached.name,
         };
         console.log("📦 Using cached SSH host:", sshHost);
      } else {
         try {
            sshHost = await this.ssh.getHost(alias);
            console.log("🔗 Retrieved SSH host:", sshHost);
         } catch (err) {
            console.error("❌ SSH host not found:", alias, err);
         }
      }

      if (!sshHost) {
         throw new VMServiceError(
            `SSH host '${alias}' not found – cannot register VM`
         );
      }

      const vmPayload = {
         name: sshHost.suggestedVMName || alias,
         host: sshHost.hostname,
         user: sshHost.user,
         environment: this.detectEnvironment(alias),
         description: sshHost.description,
         alias, // optional persistence of original alias
      };

      console.log("🏗️ Creating VM with payload:", vmPayload);

      const created = await this.vms.createVM(vmPayload);
      console.log("✅ VM created:", created);
      // Update cache
      this.vmCache.set(created.id, created);
      return created;
   }

   /**
    * Test SSH connection to VM
    * @param {string} vmId - VM ID (alias)
    * @param {number} timeout - Connection timeout in seconds
    * @returns {Promise<Object>} Connection test result
    */
   async testConnection(vmId, timeout = 10) {
      try {
         console.log(`🔗 Testing connection to VM: ${vmId}`);

         const result = await this.ssh.testConnection(vmId, { timeout });

         console.log(`✅ Connection test result for ${vmId}:`, result);
         return result;
      } catch (error) {
         console.error(`❌ Connection test failed for ${vmId}:`, error);
         throw new VMServiceError(`Connection test failed for ${vmId}`, error);
      }
   }

   /**
    * Validate SSH host configuration
    * @param {string} vmId - VM ID (alias)
    * @returns {Promise<Object>} Validation result
    */
   async validateSSHHost(vmId) {
      try {
         console.log(`🔍 Validating SSH host: ${vmId}`);

         const result = await this.ssh.validateHost(vmId);

         console.log(`✅ SSH host validation result for ${vmId}:`, result);
         return result;
      } catch (error) {
         console.error(`❌ SSH host validation failed for ${vmId}:`, error);
         throw new VMServiceError(
            `SSH host validation failed for ${vmId}`,
            error
         );
      }
   }

   /**
    * Get VM status (if available)
    * @param {string} vmId - VM ID
    * @returns {Promise<Object>} VM status information
    */
   async getVMStatus(vmId) {
      try {
         // This would be a future endpoint for VM status
         const status = await this.vms.getVMStatus(vmId);
         return status;
      } catch (error) {
         // If endpoint doesn't exist, return unknown status
         if (error instanceof ApiError && error.status === 404) {
            return {
               status: "unknown",
               message: "Status endpoint not available",
            };
         }
         throw new VMServiceError(`Failed to get VM status for ${vmId}`, error);
      }
   }

   /**
    * Execute command on VM (via WebSocket)
    * @param {string} vmId - VM ID
    * @param {string} command - Command to execute
    * @param {Object} options - Execution options
    * @returns {Promise<string>} Job ID for tracking
    */
   async executeCommand(vmId, command, options = {}) {
      if (!this.ws || !this.ws.getIsConnected()) {
         throw new VMServiceError("WebSocket connection not available");
      }

      try {
         const vm = await this.getVM(vmId);
         if (!vm) {
            throw new VMServiceError(`VM ${vmId} not found`);
         }

         const jobData = {
            command,
            type: options.type || "ssh",
            hostAlias: vm.alias,
            vmId: vm.id,
            workingDir: options.workingDir,
            timeout: options.timeout,
         };

         console.log(`📤 Executing command on ${vmId}:`, command);

         // Emit command via WebSocket
         this.ws.emit("execute-command", jobData);

         // Return a promise that resolves with job ID when job starts
         return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
               reject(new VMServiceError("Command execution timeout"));
            }, 10000);

            const handleJobStarted = (data) => {
               if (data.vmId === vmId) {
                  clearTimeout(timeout);
                  this.ws.off("job:started", handleJobStarted);
                  resolve(data.jobId);
               }
            };

            this.ws.on("job:started", handleJobStarted);
         });
      } catch (error) {
         throw new VMServiceError(
            `Failed to execute command on ${vmId}`,
            error
         );
      }
   }

   /**
    * Transform SSH host data to VM format
    * @param {Object} sshHost - SSH host data from API
    * @returns {Object} VM object
    */
   transformSSHHostToVM(sshHost) {
      return {
         id: sshHost.alias,
         name: sshHost.suggestedVMName || sshHost.alias,
         alias: sshHost.alias,
         host: sshHost.hostname,
         user: sshHost.user,
         port: sshHost.port || 22,
         environment: this.detectEnvironment(sshHost.alias),
         cloudProvider: sshHost.cloudProvider,
         description: sshHost.description,
         status: "unknown", // Will be updated by status checks
         lastSeen: null,
         createdAt: new Date().toISOString(),
         updatedAt: new Date().toISOString(),
      };
   }

   /**
    * Detect environment from VM alias
    * @param {string} alias - VM alias
    * @returns {string} Environment type
    */
   detectEnvironment(alias) {
      const lowerAlias = alias.toLowerCase();

      if (lowerAlias.includes("prod")) return "production";
      if (lowerAlias.includes("staging") || lowerAlias.includes("stage"))
         return "staging";
      if (lowerAlias.includes("test")) return "testing";
      return "development";
   }

   /**
    * Check if cache is valid
    * @returns {boolean} True if cache is valid
    */
   isValidCache() {
      return (
         this.lastRefresh &&
         Date.now() - this.lastRefresh < this.cacheTimeout &&
         this.vmCache.size > 0
      );
   }

   /**
    * Update VM cache
    * @param {Array} vms - List of VMs
    */
   updateCache(vms) {
      this.vmCache.clear();
      vms.forEach((vm) => this.vmCache.set(vm.id, vm));
      this.lastRefresh = Date.now();
   }

   /**
    * Clear VM cache
    */
   clearCache() {
      this.vmCache.clear();
      this.lastRefresh = null;
   }

   /**
    * Get cached VMs
    * @returns {Array} List of cached VMs
    */
   getCachedVMs() {
      return Array.from(this.vmCache.values());
   }
}

/**
 * Custom VM Service Error class
 */
export class VMServiceError extends Error {
   constructor(message, originalError = null) {
      super(message);
      this.name = "VMServiceError";
      this.originalError = originalError;

      if (originalError) {
         this.stack = originalError.stack;
      }
   }
}
