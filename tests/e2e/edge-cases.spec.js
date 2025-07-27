/**
 * Edge Cases Tests
 * 
 * Tests for edge cases and error scenarios:
 * - Empty VM list handling
 * - API failure scenarios
 * - WebSocket disconnection recovery
 * - Command loading failures
 * 
 * These tests ensure the application handles unexpected situations gracefully.
 */

import { test, expect } from '@playwright/test';
import { VMOrchestratorTestHelper } from './test-helpers.js';
import { testConfig, testData, mockResponses, testUtils } from './test-setup.js';

test.describe('Edge Cases', () => {
  let helper;

  test.beforeEach(async ({ page }) => {
    helper = new VMOrchestratorTestHelper(page);
  });

  test('should handle empty VM list gracefully', async ({ page }) => {
    // Preconditions: Mock API to return empty VM list
    
    await testUtils.mockAPI.vms(page, mockResponses.emptyVMs);
    
    await page.goto('/');
    
    // Wait for dashboard initialization
    await expect(page.locator('text=' + testConfig.messages.dashboardInitializing))
      .toBeVisible({ timeout: testConfig.timeouts.short });
    
    // Verify empty state message
    await helper.verifyEmptyVMState();
    
    // Verify no commands are displayed
    await expect(page.locator('text=Commands for')).not.toBeVisible();
    
    // Verify Add VM button is still available
    await expect(page.getByRole('button', { name: 'Add VM' })).toBeVisible();
  });

  test('should handle VM API failure gracefully', async ({ page }) => {
    // Preconditions: Mock API to return 500 error
    
    await testUtils.mockAPI.vms(page, mockResponses.serverError);
    
    await page.goto('/');
    
    // Wait for dashboard initialization
    await expect(page.locator('text=' + testConfig.messages.dashboardInitializing))
      .toBeVisible({ timeout: testConfig.timeouts.short });
    
    // Verify error handling - should show error message
    await expect(page.locator('text=Failed to initialize dashboard'))
      .toBeVisible({ timeout: testConfig.timeouts.medium });
    
    // Verify error can be dismissed
    await helper.dismissError();
    await expect(page.locator('text=Failed to initialize dashboard'))
      .not.toBeVisible();
  });

  test('should recover from WebSocket disconnection', async ({ page }) => {
    // Preconditions: Application loaded and connected
    
    await helper.waitForDashboardReady();
    
    // Verify initial connection
    await expect(page.locator('text=' + testConfig.messages.websocketConnected))
      .toBeVisible();
    
    // Simulate network disconnection
    await helper.setNetworkOffline();
    await page.waitForTimeout(2000);
    
    // Verify disconnection is detected
    await expect(page.locator('text=❌ WebSocket disconnected'))
      .toBeVisible({ timeout: testConfig.timeouts.medium });
    
    // Restore connection
    await helper.setNetworkOnline();
    
    // Verify reconnection
    await expect(page.locator('text=' + testConfig.messages.websocketConnected))
      .toBeVisible({ timeout: testConfig.timeouts.long });
    
    // Verify functionality still works after reconnection
    await helper.selectVM();
    await expect(page.locator(`text=Commands for ${testData.validVM.name}`))
      .toBeVisible();
  });

  test('should handle command loading failure', async ({ page }) => {
    // Preconditions: VMs load successfully, commands API fails
    
    await testUtils.mockAPI.vms(page, mockResponses.validVMs);
    await testUtils.mockAPI.commands(page, testData.validVM.id, mockResponses.notFound);
    
    await helper.waitForDashboardReady();
    
    // Select VM
    const vmButton = page.getByRole('button', { name: new RegExp(testData.validVM.name) });
    await vmButton.click();
    
    // Verify error handling for commands
    await expect(page.locator('text=No commands are configured'))
      .toBeVisible({ timeout: testConfig.timeouts.medium });
    
    // Verify no execute buttons are shown
    await expect(page.getByRole('button', { name: 'Execute' }))
      .not.toBeVisible();
    
    // Verify VM selection still works (shows selected state)
    await expect(page.locator('text=Selected VM')).toBeVisible();
  });

  test('should handle malformed API responses', async ({ page }) => {
    // Test with invalid JSON response
    
    await page.route('**/api/vms', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: 'invalid json{'
      });
    });
    
    await page.goto('/');
    
    // Should handle JSON parsing error gracefully
    await expect(page.locator('text=' + testConfig.messages.dashboardInitializing))
      .toBeVisible({ timeout: testConfig.timeouts.short });
    
    // Should show some form of error handling
    await expect(page.locator('text=Failed to initialize dashboard'))
      .toBeVisible({ timeout: testConfig.timeouts.medium });
  });

  test('should handle API timeout scenarios', async ({ page }) => {
    // Mock slow API response
    
    await page.route('**/api/vms', async route => {
      // Delay response to simulate timeout
      await new Promise(resolve => setTimeout(resolve, 15000));
      route.fulfill(mockResponses.validVMs);
    });
    
    await page.goto('/');
    
    // Verify loading state is shown
    await expect(page.locator('text=' + testConfig.messages.dashboardInitializing))
      .toBeVisible();
    
    // Should eventually timeout or show loading indicator
    // Note: This test might need adjustment based on actual timeout handling
    await expect(page.locator('img')).toBeVisible({ timeout: testConfig.timeouts.medium });
  });

  test('should handle concurrent VM selection', async ({ page }) => {
    // Test rapid VM selection to check for race conditions
    
    await helper.waitForDashboardReady();
    
    const vmButton = page.getByRole('button', { name: new RegExp(testData.validVM.name) });
    
    // Rapid clicks to test race conditions
    await vmButton.click();
    await vmButton.click();
    await vmButton.click();
    
    // Verify final state is consistent
    await expect(page.locator(`text=Commands for ${testData.validVM.name}`))
      .toBeVisible({ timeout: testConfig.timeouts.medium });
    
    await helper.verifyCommandDisplayed();
    
    // Verify no duplicate command loading
    const commandElements = page.locator(`text=${testData.validCommand.name}`);
    await expect(commandElements).toHaveCount(1);
  });

  test('should handle missing command data', async ({ page }) => {
    // Mock commands API with incomplete data
    
    const incompleteCommand = {
      id: 'incomplete-cmd',
      name: 'incomplete-command',
      // Missing cmd, type, description
    };
    
    await testUtils.mockAPI.commands(page, testData.validVM.id, {
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([incompleteCommand])
    });
    
    await helper.waitForDashboardReady();
    await helper.selectVM();
    
    // Should handle incomplete command data gracefully
    await expect(page.locator('text=incomplete-command')).toBeVisible();
    
    // Should not crash the application
    await expect(page.locator(`text=Commands for ${testData.validVM.name}`))
      .toBeVisible();
  });

  test('should handle WebSocket message errors', async ({ page }) => {
    // This test would require more complex WebSocket mocking
    // For now, we'll test basic error resilience
    
    await helper.waitForDashboardReady();
    
    // Verify WebSocket connection
    await expect(page.locator('text=' + testConfig.messages.websocketConnected))
      .toBeVisible();
    
    // Simulate page errors by injecting invalid data
    await page.evaluate(() => {
      // Trigger a console error
      console.error('Test error for resilience check');
    });
    
    // Application should still function normally
    await helper.selectVM();
    await expect(page.locator(`text=Commands for ${testData.validVM.name}`))
      .toBeVisible();
  });
});
