/**
 * Test Helpers for VM Orchestrator
 * 
 * Custom helper class and utilities for Playwright tests.
 */

import { expect } from '@playwright/test';
import { testConfig, testData } from './test-setup.js';

export class VMOrchestratorTestHelper {
  constructor(page) {
    this.page = page;
  }

  /**
   * Navigate to the application and wait for it to be ready
   */
  async waitForDashboardReady(timeout = testConfig.timeouts.long) {
    await this.page.goto('/');
    
    // Wait for dashboard initialization
    await expect(this.page.locator('text=' + testConfig.messages.dashboardInitializing))
      .toBeVisible({ timeout: testConfig.timeouts.short });
    
    // Wait for VMs to load
    await expect(this.page.locator('text=' + testConfig.messages.vmsLoaded))
      .toBeVisible({ timeout });
    
    // Wait for WebSocket connection
    await expect(this.page.locator('text=' + testConfig.messages.websocketConnected))
      .toBeVisible({ timeout: testConfig.timeouts.medium });
  }

  /**
   * Select a VM by name
   */
  async selectVM(vmName = testData.validVM.name) {
    const vmButton = this.page.getByRole('button', { name: new RegExp(vmName) });
    await vmButton.click();
    
    // Wait for commands to load
    await expect(this.page.locator(`text=Commands for ${vmName}`))
      .toBeVisible({ timeout: testConfig.timeouts.medium });
    
    // Verify VM selection state
    await expect(this.page.locator('text=Selected VM')).toBeVisible();
    await expect(this.page.locator(`text=${vmName}`)).toBeVisible();
  }

  /**
   * Wait for no running jobs
   */
  async waitForNoRunningJobs(timeout = testConfig.timeouts.veryLong) {
    await this.page.waitForFunction(
      () => !document.querySelector('text=' + testConfig.messages.running),
      { timeout }
    );
  }

  /**
   * Execute a command if possible
   */
  async executeCommand(commandName = testData.validCommand.name) {
    const executeButton = this.page.getByRole('button', { name: 'Execute' }).first();
    
    // Check if button is enabled
    const isEnabled = await executeButton.isEnabled();
    if (!isEnabled) {
      throw new Error('Execute button is disabled - likely due to running job');
    }
    
    await executeButton.click();
    
    // Verify job started
    await expect(this.page.locator('text=' + testConfig.messages.running))
      .toBeVisible({ timeout: testConfig.timeouts.medium });
  }

  /**
   * Switch to a specific tab
   */
  async switchTab(tabName) {
    const tabButton = this.page.getByRole('button', { name: tabName });
    await tabButton.click();
    
    // Verify tab is active
    await expect(tabButton).toHaveAttribute('class', /active/);
  }

  /**
   * Verify VM is displayed in sidebar
   */
  async verifyVMDisplayed(vmName = testData.validVM.name, vmHost = testData.validVM.host) {
    await expect(this.page.getByRole('button', { name: new RegExp(vmName) }))
      .toBeVisible();
    await expect(this.page.locator(`text=${vmHost}`))
      .toBeVisible();
  }

  /**
   * Verify command is displayed
   */
  async verifyCommandDisplayed(commandName = testData.validCommand.name, 
                               commandType = testData.validCommand.type,
                               commandDescription = testData.validCommand.description) {
    await expect(this.page.locator(`text=${commandName}`)).toBeVisible();
    await expect(this.page.locator(`text=${commandType}`)).toBeVisible();
    await expect(this.page.locator(`text=${commandDescription}`)).toBeVisible();
    await expect(this.page.getByRole('button', { name: 'Execute' })).toBeVisible();
  }

  /**
   * Verify empty state messages
   */
  async verifyEmptyVMState() {
    await expect(this.page.locator('text=' + testConfig.messages.noVMsConfigured))
      .toBeVisible();
    await expect(this.page.locator('text=' + testConfig.messages.selectVM))
      .toBeVisible();
    await expect(this.page.locator('text=' + testConfig.messages.chooseVM))
      .toBeVisible();
  }

  /**
   * Verify error state
   */
  async verifyErrorState(errorMessage) {
    await expect(this.page.locator(`text=${errorMessage}`)).toBeVisible();
  }

  /**
   * Dismiss error message
   */
  async dismissError() {
    const dismissButton = this.page.getByRole('button', { name: 'Dismiss' });
    await dismissButton.click();
  }

  /**
   * Verify job execution state
   */
  async verifyJobExecuting() {
    await expect(this.page.locator('text=' + testConfig.messages.executing))
      .toBeVisible();
    await expect(this.page.locator('text=' + testConfig.messages.running))
      .toBeVisible();
  }

  /**
   * Verify execute button state
   */
  async verifyExecuteButtonEnabled() {
    const executeButton = this.page.getByRole('button', { name: 'Execute' }).first();
    await expect(executeButton).toBeEnabled();
  }

  async verifyExecuteButtonDisabled() {
    const executeButton = this.page.getByRole('button', { name: 'Execute' }).first();
    await expect(executeButton).toBeDisabled();
  }

  /**
   * Wait for specific console message
   */
  async waitForConsoleMessage(message, timeout = testConfig.timeouts.medium) {
    let messageFound = false;
    
    this.page.on('console', msg => {
      if (msg.text().includes(message)) {
        messageFound = true;
      }
    });

    // Wait for the message or timeout
    await this.page.waitForFunction(
      () => messageFound,
      { timeout }
    );
  }

  /**
   * Simulate network offline/online
   */
  async setNetworkOffline() {
    await this.page.context().setOffline(true);
  }

  async setNetworkOnline() {
    await this.page.context().setOffline(false);
  }

  /**
   * Clear browser state
   */
  async clearBrowserState() {
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }

  /**
   * Get current page URL
   */
  async getCurrentURL() {
    return this.page.url();
  }

  /**
   * Reload page
   */
  async reloadPage() {
    await this.page.reload();
  }
}
