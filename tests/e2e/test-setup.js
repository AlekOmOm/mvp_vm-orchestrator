/**
 * Test Setup and Configuration
 * 
 * Contains test data, configuration, and setup utilities for VM Orchestrator tests.
 */

export const testData = {
  validVM: {
    id: '6f62c26d-3ee1-4081-a342-86a98dfec26b',
    name: 'prometheus-vm',
    host: 'ec2-16-171-17-88.eu-north-1.compute.amazonaws.com',
    user: 'ubuntu',
    environment: 'production',
    description: 'Prometheus monitoring server'
  },
  validCommand: {
    id: 'cef58829-a292-4135-bef2-6712048c0b5e',
    name: 'docker-ps',
    cmd: 'docker ps',
    type: 'ssh',
    description: 'List running Docker containers',
    timeout: 30000
  },
  emptyVMList: [],
  apiErrorResponse: {
    error: 'Internal Server Error'
  }
};

export const testConfig = {
  timeouts: {
    short: 5000,
    medium: 10000,
    long: 30000,
    veryLong: 60000
  },
  urls: {
    frontend: 'http://localhost:5174',
    backend: 'http://localhost:3000'
  },
  selectors: {
    vmButton: (vmName) => `button:has-text("${vmName}")`,
    executeButton: 'button:has-text("Execute")',
    historyButton: 'button:has-text("History")',
    addVMButton: 'button:has-text("Add VM")',
    dismissButton: 'button:has-text("Dismiss")'
  },
  messages: {
    dashboardInitializing: '🚀 Dashboard initializing...',
    vmsLoaded: '✅ VMs loaded',
    websocketConnected: '✅ WebSocket connected',
    commandsLoaded: '📋 Commands loaded',
    jobHistoryLoaded: '📚 Job history loaded',
    noVMsConfigured: 'No VMs configured',
    selectVM: 'Select a VM',
    chooseVM: 'Choose a virtual machine to see available commands',
    running: 'Running:',
    executing: 'Executing'
  }
};

export const mockResponses = {
  emptyVMs: {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([])
  },
  serverError: {
    status: 500,
    contentType: 'application/json',
    body: JSON.stringify({ error: 'Internal Server Error' })
  },
  notFound: {
    status: 404,
    contentType: 'application/json',
    body: JSON.stringify({ error: 'Not found' })
  },
  validVMs: {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([testData.validVM])
  },
  validCommands: {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([testData.validCommand])
  }
};

/**
 * Common test utilities
 */
export const testUtils = {
  /**
   * Wait for console message to appear
   */
  waitForConsoleMessage: async (page, message, timeout = testConfig.timeouts.medium) => {
    return page.waitForFunction(
      (msg) => {
        const logs = window.console._logs || [];
        return logs.some(log => log.includes(msg));
      },
      message,
      { timeout }
    );
  },

  /**
   * Clear browser storage and cache
   */
  clearBrowserState: async (page) => {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  },

  /**
   * Mock API endpoints
   */
  mockAPI: {
    vms: (page, response = mockResponses.validVMs) => {
      return page.route('**/api/vms', route => route.fulfill(response));
    },
    commands: (page, vmId, response = mockResponses.validCommands) => {
      return page.route(`**/api/vms/${vmId}/commands`, route => route.fulfill(response));
    },
    jobs: (page, vmId, response = { status: 200, contentType: 'application/json', body: '[]' }) => {
      return page.route(`**/api/vms/${vmId}/jobs*`, route => route.fulfill(response));
    }
  }
};
