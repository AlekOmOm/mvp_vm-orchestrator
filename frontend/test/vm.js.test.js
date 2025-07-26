import { describe, it, expect, vi, beforeEach } from "vitest";
import {
   VM_ENVIRONMENTS,
   VM_STATUS,
   DEFAULT_VM_FORM,
   VM_VALIDATION_RULES,
   createVMFormData,
   getEnvironmentDisplay,
   getStatusDisplay,
   formatVMConnection,
   validateVMForm,
   loadVMCommandCount,
   loadVMCommandCounts,
   getSSHHostAlias,
} from "../src/lib/components/vm/vm.js";

describe("vm.js utility functions", () => {
   describe("VM_ENVIRONMENTS constant", () => {
      it("should contain all expected environment options", () => {
         expect(VM_ENVIRONMENTS).toHaveLength(4);

         const environments = VM_ENVIRONMENTS.map((env) => env.value);
         expect(environments).toContain("development");
         expect(environments).toContain("staging");
         expect(environments).toContain("production");
         expect(environments).toContain("testing");
      });

      it("should have correct structure for each environment", () => {
         VM_ENVIRONMENTS.forEach((env) => {
            expect(env).toHaveProperty("value");
            expect(env).toHaveProperty("label");
            expect(env).toHaveProperty("color");
            expect(typeof env.value).toBe("string");
            expect(typeof env.label).toBe("string");
            expect(typeof env.color).toBe("string");
         });
      });

      it("should have production environment with red color", () => {
         const production = VM_ENVIRONMENTS.find(
            (env) => env.value === "production"
         );
         expect(production).toBeDefined();
         expect(production.color).toBe("red");
      });
   });

   describe("VM_STATUS constant", () => {
      it("should contain all expected status types", () => {
         expect(VM_STATUS).toHaveProperty("ONLINE");
         expect(VM_STATUS).toHaveProperty("OFFLINE");
         expect(VM_STATUS).toHaveProperty("UNKNOWN");
         expect(VM_STATUS).toHaveProperty("CONNECTING");
      });

      it("should have correct structure for each status", () => {
         Object.values(VM_STATUS).forEach((status) => {
            expect(status).toHaveProperty("label");
            expect(status).toHaveProperty("color");
            expect(status).toHaveProperty("icon");
            expect(typeof status.label).toBe("string");
            expect(typeof status.color).toBe("string");
            expect(typeof status.icon).toBe("string");
         });
      });

      it("should have online status with green color", () => {
         expect(VM_STATUS.ONLINE.color).toBe("green");
         expect(VM_STATUS.ONLINE.label).toBe("Online");
      });
   });

   describe("DEFAULT_VM_FORM constant", () => {
      it("should have all required form fields", () => {
         expect(DEFAULT_VM_FORM).toHaveProperty("name");
         expect(DEFAULT_VM_FORM).toHaveProperty("host");
         expect(DEFAULT_VM_FORM).toHaveProperty("user");
         expect(DEFAULT_VM_FORM).toHaveProperty("environment");
         expect(DEFAULT_VM_FORM).toHaveProperty("port");
         expect(DEFAULT_VM_FORM).toHaveProperty("description");
         expect(DEFAULT_VM_FORM).toHaveProperty("sshHost");
      });

      it("should have correct default values", () => {
         expect(DEFAULT_VM_FORM.name).toBe("");
         expect(DEFAULT_VM_FORM.host).toBe("");
         expect(DEFAULT_VM_FORM.user).toBe("");
         expect(DEFAULT_VM_FORM.environment).toBe("development");
         expect(DEFAULT_VM_FORM.port).toBe(22);
         expect(DEFAULT_VM_FORM.description).toBe("");
         expect(DEFAULT_VM_FORM.sshHost).toBe("");
      });
   });

   describe("createVMFormData function", () => {
      it("should return default form data when no VM provided", () => {
         const result = createVMFormData();
         expect(result).toEqual(DEFAULT_VM_FORM);
      });

      it("should return default form data when null VM provided", () => {
         const result = createVMFormData(null);
         expect(result).toEqual(DEFAULT_VM_FORM);
      });

      it("should populate form data from existing VM", () => {
         const existingVM = {
            name: "test-vm",
            host: "192.168.1.100",
            user: "ubuntu",
            environment: "production",
            port: 2222,
            description: "Test VM",
            sshHost: "test-ssh",
         };

         const result = createVMFormData(existingVM);
         expect(result).toEqual(existingVM);
      });

      it("should use default values for missing VM properties", () => {
         const partialVM = {
            name: "partial-vm",
            host: "192.168.1.50",
         };

         const result = createVMFormData(partialVM);
         expect(result.name).toBe("partial-vm");
         expect(result.host).toBe("192.168.1.50");
         expect(result.user).toBe("");
         expect(result.environment).toBe("development");
         expect(result.port).toBe(22);
         expect(result.description).toBe("");
         expect(result.sshHost).toBe("");
      });
   });

   describe("getEnvironmentDisplay function", () => {
      it("should return correct environment for valid values", () => {
         const dev = getEnvironmentDisplay("development");
         expect(dev.value).toBe("development");
         expect(dev.label).toBe("Development");
         expect(dev.color).toBe("blue");

         const prod = getEnvironmentDisplay("production");
         expect(prod.value).toBe("production");
         expect(prod.label).toBe("Production");
         expect(prod.color).toBe("red");
      });

      it("should return first environment for invalid values", () => {
         const invalid = getEnvironmentDisplay("invalid");
         expect(invalid).toEqual(VM_ENVIRONMENTS[0]);
      });

      it("should return first environment for null/undefined", () => {
         const nullResult = getEnvironmentDisplay(null);
         const undefinedResult = getEnvironmentDisplay(undefined);

         expect(nullResult).toEqual(VM_ENVIRONMENTS[0]);
         expect(undefinedResult).toEqual(VM_ENVIRONMENTS[0]);
      });
   });

   describe("formatVMConnection function", () => {
      it("should format VM connection string correctly", () => {
         const vm = {
            user: "ubuntu",
            host: "192.168.1.100",
            port: 22,
         };

         const result = formatVMConnection(vm);
         expect(result).toBe("ubuntu@192.168.1.100");
      });

      it("should handle missing port", () => {
         const vm = {
            user: "admin",
            host: "example.com",
         };

         const result = formatVMConnection(vm);
         expect(result).toBe("admin@example.com");
      });

      it("should handle custom port", () => {
         const vm = {
            user: "root",
            host: "server.local",
            port: 2222,
         };

         const result = formatVMConnection(vm);
         expect(result).toBe("root@server.local:2222");
      });
   });

   describe("validateVMForm function", () => {
      it("should return valid result for valid form data", () => {
         const validForm = {
            name: "test-vm",
            host: "192.168.1.100",
            user: "ubuntu",
            environment: "development",
            port: 22,
         };

         const result = validateVMForm(validForm);
         expect(result.isValid).toBe(true);
         expect(Object.keys(result.errors)).toHaveLength(0);
      });

      it("should return errors for missing required fields", () => {
         const invalidForm = {
            name: "",
            host: "",
            user: "",
            environment: "development",
            port: 22,
         };

         const result = validateVMForm(invalidForm);
         expect(result.isValid).toBe(false);
         expect(result.errors.name).toBeDefined();
         expect(result.errors.host).toBeDefined();
         expect(result.errors.user).toBeDefined();
      });

      it("should validate port number range", () => {
         const invalidPortForm = {
            name: "test",
            host: "192.168.1.100",
            user: "ubuntu",
            environment: "development",
            port: 70000,
         };

         const result = validateVMForm(invalidPortForm);
         expect(result.isValid).toBe(false);
         expect(result.errors.port).toBeDefined();
      });

      it("should validate name pattern", () => {
         const invalidNameForm = {
            name: "test vm!",
            host: "192.168.1.100",
            user: "ubuntu",
            environment: "development",
            port: 22,
         };

         const result = validateVMForm(invalidNameForm);
         expect(result.isValid).toBe(false);
         expect(result.errors.name).toBeDefined();
      });
   });

   describe("getStatusDisplay function", () => {
      it("should return correct status display for valid status", () => {
         const online = getStatusDisplay("ONLINE");
         expect(online).toEqual(VM_STATUS.ONLINE);

         const offline = getStatusDisplay("OFFLINE");
         expect(offline).toEqual(VM_STATUS.OFFLINE);
      });

      it("should return UNKNOWN status for invalid status", () => {
         const invalid = getStatusDisplay("INVALID");
         expect(invalid).toEqual(VM_STATUS.UNKNOWN);
      });

      it("should return UNKNOWN status for null/undefined", () => {
         const nullResult = getStatusDisplay(null);
         const undefinedResult = getStatusDisplay(undefined);

         expect(nullResult).toEqual(VM_STATUS.UNKNOWN);
         expect(undefinedResult).toEqual(VM_STATUS.UNKNOWN);
      });
   });

   describe("getSSHHostAlias function", () => {
      it("should return explicit sshHost if provided", () => {
         const vm = {
            name: "test-vm",
            sshHost: "custom-ssh-host",
         };

         const result = getSSHHostAlias(vm);
         expect(result).toBe("custom-ssh-host");
      });

      it("should map known VM names to SSH hosts", () => {
         const prometheusVM = { name: "prometheus-vm" };
         expect(getSSHHostAlias(prometheusVM)).toBe("prometheus");

         const grafanaVM = { name: "grafana-vm" };
         expect(getSSHHostAlias(grafanaVM)).toBe("grafana");

         const grafanaDbVM = { name: "grafana-db-vm" };
         expect(getSSHHostAlias(grafanaDbVM)).toBe("grafana-db");
      });

      it("should return VM name for unknown mappings", () => {
         const unknownVM = { name: "unknown-vm" };
         expect(getSSHHostAlias(unknownVM)).toBe("unknown-vm");
      });
   });

   describe("VM_VALIDATION_RULES constant", () => {
      it("should have validation rules for all required fields", () => {
         expect(VM_VALIDATION_RULES).toHaveProperty("name");
         expect(VM_VALIDATION_RULES).toHaveProperty("host");
         expect(VM_VALIDATION_RULES).toHaveProperty("user");
         expect(VM_VALIDATION_RULES).toHaveProperty("port");
         expect(VM_VALIDATION_RULES).toHaveProperty("environment");
      });

      it("should have correct structure for validation rules", () => {
         Object.values(VM_VALIDATION_RULES).forEach((rule) => {
            expect(rule).toHaveProperty("required");
            expect(rule).toHaveProperty("message");
         });
      });
   });

   // Note: Async functions (loadVMCommandCount, loadVMCommandCounts) are tested
   // in integration tests since they depend on external stores
});
