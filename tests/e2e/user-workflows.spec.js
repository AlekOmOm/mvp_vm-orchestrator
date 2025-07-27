/**
 * User Workflows Tests
 * 
 * End-to-end workflow tests covering complete user journeys:
 * - Complete VM selection to job completion workflow
 * - Tab switching during active jobs
 * - Job monitoring and history viewing
 * 
 * These tests ensure the application works correctly for real user scenarios.
 */

import { test, expect } from '@playwright/test';
import { VMOrchestratorTestHelper } from './test-helpers.js';
import { testConfig, testData } from './test-setup.js';

test.describe('User Workflows', () => {
  let helper;

  test.beforeEach(async ({ page }) => {
    helper = new VMOrchestratorTestHelper(page);
  });

  test('should complete full VM selection to job monitoring workflow', async ({ page }) => {
    // Complete end-to-end workflow test
    
    // Step 1: Initialize application
    await helper.waitForDashboardReady();
    
    // Verify initial state
    await expect(page.locator('text=' + testConfig.messages.selectVM))
      .toBeVisible();
    
    // Step 2: Select VM
    await helper.selectVM();
    
    // Verify VM selection completed
    await expect(page.locator('text=Selected VM')).toBeVisible();
    await expect(page.locator(`text=${testData.validVM.name}`)).toBeVisible();
    
    // Step 3: Verify commands loaded
    await helper.verifyCommandDisplayed();
    
    // Step 4: Check execute button state
    const executeButton = page.getByRole('button', { name: 'Execute' }).first();
    await expect(executeButton).toBeVisible();
    
    const isEnabled = await executeButton.isEnabled();
    
    if (isEnabled) {
      // Step 5: Execute command
      await executeButton.click();
      
      // Step 6: Monitor job execution
      await expect(page.locator('text=' + testConfig.messages.running))
        .toBeVisible({ timeout: testConfig.timeouts.medium });
      
      // Verify execute button becomes disabled
      await expect(executeButton).toBeDisabled();
      
      // Step 7: Wait for job completion (with reasonable timeout)
      await expect(page.locator('text=' + testConfig.messages.running))
        .not.toBeVisible({ timeout: testConfig.timeouts.veryLong });
      
      // Step 8: Verify execute button re-enabled
      await expect(executeButton).toBeEnabled();
    } else {
      // If button is disabled, verify it's due to running job
      await expect(page.locator('text=' + testConfig.messages.running))
        .toBeVisible();
    }
    
    // Step 9: Check job history
    await helper.switchTab('History');
    await expect(page.locator('text=Job History')).toBeVisible();
    
    // Verify job history loaded
    await expect(page.locator('text=' + testConfig.messages.jobHistoryLoaded))
      .toBeVisible({ timeout: testConfig.timeouts.medium });
  });

  test('should maintain job state when switching tabs', async ({ page }) => {
    // Test tab switching during active job
    
    await helper.waitForDashboardReady();
    await helper.selectVM();
    
    const executeButton = page.getByRole('button', { name: 'Execute' }).first();
    
    // Start a job if possible
    const isEnabled = await executeButton.isEnabled();
    if (isEnabled) {
      await executeButton.click();
      await expect(page.locator('text=' + testConfig.messages.running))
        .toBeVisible();
    }
    
    // Verify job status is shown
    const runningStatus = page.locator('text=' + testConfig.messages.running);
    if (await runningStatus.isVisible()) {
      // Switch to History tab
      await helper.switchTab('History');
      await expect(page.locator('text=Job History')).toBeVisible();
      
      // Verify job status still shown at bottom
      await expect(runningStatus).toBeVisible();
      
      // Switch back to Execute tab
      await helper.switchTab('Execute');
      
      // Verify command still disabled and job status maintained
      await expect(executeButton).toBeDisabled();
      await expect(runningStatus).toBeVisible();
      
      // Verify commands are still displayed
      await expect(page.locator(`text=Commands for ${testData.validVM.name}`))
        .toBeVisible();
    }
  });

  test('should handle job history filtering and viewing', async ({ page }) => {
    // Test job history functionality
    
    await helper.waitForDashboardReady();
    await helper.selectVM();
    
    // Switch to History tab
    await helper.switchTab('History');
    
    // Verify job history interface
    await expect(page.locator('text=Job History')).toBeVisible();
    
    // Verify filtering options are available
    await expect(page.locator('text=Recent Jobs')).toBeVisible();
    await expect(page.locator('text=Current VM')).toBeVisible();
    await expect(page.locator('text=All Jobs')).toBeVisible();
    
    // Test filter switching
    await page.locator('text=All Jobs').click();
    await expect(page.locator('text=All Jobs')).toHaveClass(/active/);
    
    await page.locator('text=Current VM').click();
    await expect(page.locator('text=Current VM')).toHaveClass(/active/);
    
    // Verify job history loads
    await expect(page.locator('text=' + testConfig.messages.jobHistoryLoaded))
      .toBeVisible({ timeout: testConfig.timeouts.medium });
  });

  test('should handle VM reselection workflow', async ({ page }) => {
    // Test selecting different VMs (or reselecting same VM)
    
    await helper.waitForDashboardReady();
    
    // Initial VM selection
    await helper.selectVM();
    await expect(page.locator(`text=Commands for ${testData.validVM.name}`))
      .toBeVisible();
    
    // Reselect the same VM (test idempotency)
    const vmButton = page.getByRole('button', { name: new RegExp(testData.validVM.name) });
    await vmButton.click();
    
    // Verify commands are still displayed correctly
    await expect(page.locator(`text=Commands for ${testData.validVM.name}`))
      .toBeVisible();
    
    await helper.verifyCommandDisplayed();
    
    // Verify VM selection state is maintained
    await expect(page.locator('text=Selected VM')).toBeVisible();
    await expect(page.locator(`text=${testData.validVM.name}`)).toBeVisible();
  });

  test('should handle application refresh during workflow', async ({ page }) => {
    // Test workflow interruption and recovery
    
    await helper.waitForDashboardReady();
    await helper.selectVM();
    
    // Verify initial state
    await expect(page.locator(`text=Commands for ${testData.validVM.name}`))
      .toBeVisible();
    
    // Refresh page
    await helper.reloadPage();
    
    // Verify application reinitializes correctly
    await expect(page.locator('text=' + testConfig.messages.dashboardInitializing))
      .toBeVisible({ timeout: testConfig.timeouts.short });
    
    await expect(page.locator('text=' + testConfig.messages.vmsLoaded))
      .toBeVisible({ timeout: testConfig.timeouts.long });
    
    await expect(page.locator('text=' + testConfig.messages.websocketConnected))
      .toBeVisible({ timeout: testConfig.timeouts.medium });
    
    // Verify VMs are still available (but selection is reset)
    await helper.verifyVMDisplayed();
    await expect(page.locator('text=' + testConfig.messages.selectVM))
      .toBeVisible();
    
    // Verify can reselect VM and continue workflow
    await helper.selectVM();
    await helper.verifyCommandDisplayed();
  });

  test('should handle command execution with output viewing', async ({ page }) => {
    // Test complete command execution and output viewing workflow
    
    await helper.waitForDashboardReady();
    await helper.selectVM();
    
    const executeButton = page.getByRole('button', { name: 'Execute' }).first();
    
    if (await executeButton.isEnabled()) {
      // Execute command
      await executeButton.click();
      
      // Verify execution started
      await expect(page.locator('text=Executing command:'))
        .toBeVisible({ timeout: testConfig.timeouts.medium });
      
      // Verify log output area is visible
      await expect(page.locator('[data-testid="log-viewer"]'))
        .toBeVisible();
      
      // Wait for some output or completion
      await page.waitForTimeout(5000);
      
      // Check if job is still running or completed
      const isStillRunning = await page.locator('text=' + testConfig.messages.running).isVisible();
      
      if (!isStillRunning) {
        // Job completed - verify execute button is re-enabled
        await expect(executeButton).toBeEnabled();
        
        // Check job history for the completed job
        await helper.switchTab('History');
        await expect(page.locator('text=Job History')).toBeVisible();
      }
    }
  });

  test('should handle error recovery workflow', async ({ page }) => {
    // Test error scenarios and recovery
    
    await helper.waitForDashboardReady();
    
    // Simulate a temporary network issue
    await helper.setNetworkOffline();
    await page.waitForTimeout(1000);
    
    // Try to select VM while offline
    const vmButton = page.getByRole('button', { name: new RegExp(testData.validVM.name) });
    await vmButton.click();
    
    // Restore network
    await helper.setNetworkOnline();
    
    // Verify recovery
    await expect(page.locator('text=' + testConfig.messages.websocketConnected))
      .toBeVisible({ timeout: testConfig.timeouts.long });
    
    // Verify can continue normal workflow
    await helper.selectVM();
    await helper.verifyCommandDisplayed();
  });
});
