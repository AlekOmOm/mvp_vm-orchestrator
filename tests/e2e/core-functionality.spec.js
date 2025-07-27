/**
 * Core Functionality Tests
 * 
 * Critical priority tests covering the main VM Orchestrator functionality:
 * - VM loading and display
 * - VM selection and command loading  
 * - Command execution flow
 * 
 * These tests cover the core functionality we just fixed and should run on every commit.
 */

import { test, expect } from '@playwright/test';
import { VMOrchestratorTestHelper } from './test-helpers.js';
import { testConfig, testData } from './test-setup.js';

test.describe('Core Functionality', () => {
  let helper;

  test.beforeEach(async ({ page }) => {
    helper = new VMOrchestratorTestHelper(page);
  });

  test('should load and display VMs correctly', async ({ page }) => {
    // Preconditions: Backend running, VMs available in database
    
    await page.goto('/');
    
    // Wait for dashboard initialization
    await expect(page.locator('text=' + testConfig.messages.dashboardInitializing))
      .toBeVisible({ timeout: testConfig.timeouts.short });
    
    // Verify VM loading process
    await expect(page.locator('text=' + testConfig.messages.vmsLoaded))
      .toBeVisible({ timeout: testConfig.timeouts.long });
    
    // Verify VM appears in sidebar
    await helper.verifyVMDisplayed();
    
    // Verify no error states
    await expect(page.locator('text=' + testConfig.messages.noVMsConfigured))
      .not.toBeVisible();
    
    // Verify WebSocket connection
    await expect(page.locator('text=' + testConfig.messages.websocketConnected))
      .toBeVisible({ timeout: testConfig.timeouts.medium });
  });

  test('should load commands when VM is selected', async ({ page }) => {
    // Preconditions: VMs loaded, commands available for VM
    
    await helper.waitForDashboardReady();
    
    // Select VM
    await helper.selectVM();
    
    // Verify command loading console message
    await expect(page.locator('text=loadVMCommands'))
      .toBeVisible({ timeout: testConfig.timeouts.medium });
    
    // Verify command details are displayed
    await helper.verifyCommandDisplayed();
    
    // Verify VM selection state in sidebar
    await expect(page.locator('text=Selected VM')).toBeVisible();
    await expect(page.locator(`text=${testData.validVM.name}`)).toBeVisible();
  });

  test('should show execute button for commands', async ({ page }) => {
    // Preconditions: VM selected, commands loaded
    
    await helper.waitForDashboardReady();
    await helper.selectVM();
    
    // Verify execute button exists and is visible
    const executeButton = page.getByRole('button', { name: 'Execute' }).first();
    await expect(executeButton).toBeVisible();
    
    // Verify command details are complete
    await expect(page.locator(`text=${testData.validCommand.name}`)).toBeVisible();
    await expect(page.locator(`text=${testData.validCommand.type}`)).toBeVisible();
    await expect(page.locator(`text=${testData.validCommand.description}`)).toBeVisible();
    
    // Verify the execute button is in the command section
    const commandSection = page.locator(`text=Commands for ${testData.validVM.name}`);
    await expect(commandSection).toBeVisible();
  });

  test('should handle command execution state correctly', async ({ page }) => {
    // Preconditions: VM selected, no active jobs (if possible)
    
    await helper.waitForDashboardReady();
    await helper.selectVM();
    
    const executeButton = page.getByRole('button', { name: 'Execute' }).first();
    await expect(executeButton).toBeVisible();
    
    // Check if execute button is enabled or disabled
    const isEnabled = await executeButton.isEnabled();
    
    if (isEnabled) {
      // Test execution flow
      await executeButton.click();
      
      // Verify job execution indicators
      await expect(page.locator('text=Executing command:'))
        .toBeVisible({ timeout: testConfig.timeouts.medium });
      
      // Verify execute button becomes disabled during execution
      await expect(executeButton).toBeDisabled();
      
      // Verify running status appears
      await expect(page.locator('text=' + testConfig.messages.running))
        .toBeVisible();
        
    } else {
      // If button is disabled, verify it's due to running job
      await expect(page.locator('text=' + testConfig.messages.running))
        .toBeVisible();
      
      // Verify executing status is shown
      await expect(page.locator('text=' + testConfig.messages.executing))
        .toBeVisible();
    }
  });

  test('should maintain WebSocket connection', async ({ page }) => {
    // Verify WebSocket connection is established and maintained
    
    await helper.waitForDashboardReady();
    
    // Verify initial connection
    await expect(page.locator('text=' + testConfig.messages.websocketConnected))
      .toBeVisible();
    
    // Verify commands are loaded via WebSocket
    await expect(page.locator('text=' + testConfig.messages.commandsLoaded))
      .toBeVisible({ timeout: testConfig.timeouts.medium });
    
    // Verify job history is loaded
    await expect(page.locator('text=' + testConfig.messages.jobHistoryLoaded))
      .toBeVisible({ timeout: testConfig.timeouts.medium });
    
    // Test WebSocket functionality by selecting VM (triggers command loading)
    await helper.selectVM();
    
    // Verify command loading works (indicates WebSocket is functional)
    await expect(page.locator(`text=Commands for ${testData.validVM.name}`))
      .toBeVisible();
  });

  test('should display VM details correctly', async ({ page }) => {
    // Verify all VM information is displayed properly
    
    await helper.waitForDashboardReady();
    
    // Verify VM button shows name and host
    const vmButton = page.getByRole('button', { name: new RegExp(testData.validVM.name) });
    await expect(vmButton).toBeVisible();
    await expect(vmButton).toContainText(testData.validVM.name);
    await expect(vmButton).toContainText(testData.validVM.host);
    
    // Select VM and verify detailed info
    await helper.selectVM();
    
    // Verify selected VM info section
    await expect(page.locator('text=Selected VM')).toBeVisible();
    await expect(page.locator(`text=${testData.validVM.name}`)).toBeVisible();
    await expect(page.locator(`text=@${testData.validVM.host}`)).toBeVisible();
  });

  test('should handle tab navigation correctly', async ({ page }) => {
    // Test basic tab switching functionality
    
    await helper.waitForDashboardReady();
    
    // Verify Execute tab is active by default
    const executeTab = page.getByRole('button', { name: 'Execute' });
    const historyTab = page.getByRole('button', { name: 'History' });
    
    await expect(executeTab).toHaveClass(/active/);
    
    // Switch to History tab
    await historyTab.click();
    await expect(historyTab).toHaveClass(/active/);
    await expect(page.locator('text=Job History')).toBeVisible();
    
    // Switch back to Execute tab
    await executeTab.click();
    await expect(executeTab).toHaveClass(/active/);
    await expect(page.locator('text=' + testConfig.messages.selectVM))
      .toBeVisible();
  });
});
