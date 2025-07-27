import { test, expect } from '@playwright/test';

/**
 * Test Workflow 5: Data Persistence
 * 
 * Tests refresh behavior, VM switching, and data consistency
 */

test.describe('Command Data Persistence', () => {
  let testCommandName = '';
  let secondTestCommandName = '';

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    testCommandName = `Persist Test ${Date.now()}`;
    secondTestCommandName = `Persist Test 2 ${Date.now()}`;
  });

  test.describe('Refresh Behavior', () => {
    test('should persist created commands after page refresh', async ({ page }) => {
      // Select a VM
      await page.waitForSelector('[data-testid="vm-selector"]', { timeout: 10000 });
      const vmSelector = page.locator('[data-testid="vm-selector"]').first();
      if (await vmSelector.isVisible()) {
        await vmSelector.click();
      }
      
      // Create a command
      await page.click('button:has-text("Add Command")');
      await page.fill('#command-name', testCommandName);
      await page.fill('#command-cmd', 'echo "persist test"');
      await page.fill('#command-description', 'Test persistence');
      await page.click('button:has-text("Create Command")');
      await expect(page.locator(`text=${testCommandName}`)).toBeVisible();
      
      // Refresh the page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Re-select the same VM
      await page.waitForSelector('[data-testid="vm-selector"]', { timeout: 10000 });
      const vmSelectorAfterRefresh = page.locator('[data-testid="vm-selector"]').first();
      if (await vmSelectorAfterRefresh.isVisible()) {
        await vmSelectorAfterRefresh.click();
      }
      
      // Verify command still exists
      await expect(page.locator(`text=${testCommandName}`)).toBeVisible();
      await expect(page.locator('text=echo "persist test"')).toBeVisible();
      await expect(page.locator('text=Test persistence')).toBeVisible();
    });

    test('should persist updated commands after page refresh', async ({ page }) => {
      // Select a VM
      await page.waitForSelector('[data-testid="vm-selector"]', { timeout: 10000 });
      const vmSelector = page.locator('[data-testid="vm-selector"]').first();
      if (await vmSelector.isVisible()) {
        await vmSelector.click();
      }
      
      // Create a command
      await page.click('button:has-text("Add Command")');
      await page.fill('#command-name', testCommandName);
      await page.fill('#command-cmd', 'echo "original"');
      await page.click('button:has-text("Create Command")');
      await expect(page.locator(`text=${testCommandName}`)).toBeVisible();
      
      // Update the command
      const commandCard = page.locator(`text=${testCommandName}`).locator('..').locator('..');
      await commandCard.locator('button[data-testid="edit-command"]').click();
      const updatedName = `${testCommandName} - Updated`;
      await page.fill('#name', updatedName);
      await page.fill('#cmd', 'echo "updated"');
      await page.click('button:has-text("Update Command")');
      await expect(page.locator(`text=${updatedName}`)).toBeVisible();
      
      // Refresh the page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Re-select the same VM
      await page.waitForSelector('[data-testid="vm-selector"]', { timeout: 10000 });
      const vmSelectorAfterRefresh = page.locator('[data-testid="vm-selector"]').first();
      if (await vmSelectorAfterRefresh.isVisible()) {
        await vmSelectorAfterRefresh.click();
      }
      
      // Verify updated command persists
      await expect(page.locator(`text=${updatedName}`)).toBeVisible();
      await expect(page.locator('text=echo "updated"')).toBeVisible();
      await expect(page.locator(`text=${testCommandName}`)).not.toBeVisible(); // Original name should be gone
    });

    test('should reflect deleted commands after page refresh', async ({ page }) => {
      // Select a VM
      await page.waitForSelector('[data-testid="vm-selector"]', { timeout: 10000 });
      const vmSelector = page.locator('[data-testid="vm-selector"]').first();
      if (await vmSelector.isVisible()) {
        await vmSelector.click();
      }
      
      // Create a command
      await page.click('button:has-text("Add Command")');
      await page.fill('#command-name', testCommandName);
      await page.fill('#command-cmd', 'echo "to delete"');
      await page.click('button:has-text("Create Command")');
      await expect(page.locator(`text=${testCommandName}`)).toBeVisible();
      
      // Delete the command
      const commandCard = page.locator(`text=${testCommandName}`).locator('..').locator('..');
      await commandCard.locator('button[data-testid="delete-command"]').click();
      await page.click('button:has-text("Delete Command")');
      await expect(page.locator(`text=${testCommandName}`)).not.toBeVisible();
      
      // Refresh the page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Re-select the same VM
      await page.waitForSelector('[data-testid="vm-selector"]', { timeout: 10000 });
      const vmSelectorAfterRefresh = page.locator('[data-testid="vm-selector"]').first();
      if (await vmSelectorAfterRefresh.isVisible()) {
        await vmSelectorAfterRefresh.click();
      }
      
      // Verify command is still deleted
      await expect(page.locator(`text=${testCommandName}`)).not.toBeVisible();
    });

    test('should maintain command list state after refresh', async ({ page }) => {
      // Select a VM
      await page.waitForSelector('[data-testid="vm-selector"]', { timeout: 10000 });
      const vmSelector = page.locator('[data-testid="vm-selector"]').first();
      if (await vmSelector.isVisible()) {
        await vmSelector.click();
      }
      
      // Create multiple commands
      const commands = [
        { name: `${testCommandName} 1`, cmd: 'echo "test1"' },
        { name: `${testCommandName} 2`, cmd: 'echo "test2"' },
        { name: `${testCommandName} 3`, cmd: 'echo "test3"' }
      ];
      
      for (const command of commands) {
        await page.click('button:has-text("Add Command")');
        await page.fill('#command-name', command.name);
        await page.fill('#command-cmd', command.cmd);
        await page.click('button:has-text("Create Command")');
        await expect(page.locator(`text=${command.name}`)).toBeVisible();
      }
      
      // Count commands before refresh
      const commandsBefore = await page.locator('[data-testid="command-card"]').count();
      
      // Refresh the page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Re-select the same VM
      await page.waitForSelector('[data-testid="vm-selector"]', { timeout: 10000 });
      const vmSelectorAfterRefresh = page.locator('[data-testid="vm-selector"]').first();
      if (await vmSelectorAfterRefresh.isVisible()) {
        await vmSelectorAfterRefresh.click();
      }
      
      // Verify all commands are still there
      for (const command of commands) {
        await expect(page.locator(`text=${command.name}`)).toBeVisible();
      }
      
      // Verify command count is the same
      const commandsAfter = await page.locator('[data-testid="command-card"]').count();
      expect(commandsAfter).toBe(commandsBefore);
    });
  });

  test.describe('VM Switching', () => {
    test('should show different commands for different VMs', async ({ page }) => {
      // Check if multiple VMs are available
      await page.waitForSelector('[data-testid="vm-selector"]', { timeout: 10000 });
      const vmSelectors = page.locator('[data-testid="vm-selector"]');
      const vmCount = await vmSelectors.count();
      
      if (vmCount < 2) {
        test.skip('Test requires at least 2 VMs');
      }
      
      // Select first VM
      await vmSelectors.nth(0).click();
      
      // Create a command for first VM
      await page.click('button:has-text("Add Command")');
      await page.fill('#command-name', `VM1 - ${testCommandName}`);
      await page.fill('#command-cmd', 'echo "vm1 command"');
      await page.click('button:has-text("Create Command")');
      await expect(page.locator(`text=VM1 - ${testCommandName}`)).toBeVisible();
      
      // Switch to second VM
      await vmSelectors.nth(1).click();
      
      // Verify first VM's command is not visible
      await expect(page.locator(`text=VM1 - ${testCommandName}`)).not.toBeVisible();
      
      // Create a command for second VM
      await page.click('button:has-text("Add Command")');
      await page.fill('#command-name', `VM2 - ${testCommandName}`);
      await page.fill('#command-cmd', 'echo "vm2 command"');
      await page.click('button:has-text("Create Command")');
      await expect(page.locator(`text=VM2 - ${testCommandName}`)).toBeVisible();
      
      // Switch back to first VM
      await vmSelectors.nth(0).click();
      
      // Verify first VM's command is back and second VM's is not visible
      await expect(page.locator(`text=VM1 - ${testCommandName}`)).toBeVisible();
      await expect(page.locator(`text=VM2 - ${testCommandName}`)).not.toBeVisible();
    });

    test('should maintain VM-specific command state during session', async ({ page }) => {
      // Check if multiple VMs are available
      await page.waitForSelector('[data-testid="vm-selector"]', { timeout: 10000 });
      const vmSelectors = page.locator('[data-testid="vm-selector"]');
      const vmCount = await vmSelectors.count();
      
      if (vmCount < 2) {
        test.skip('Test requires at least 2 VMs');
      }
      
      // Create commands for both VMs
      await vmSelectors.nth(0).click();
      await page.click('button:has-text("Add Command")');
      await page.fill('#command-name', `VM1 - ${testCommandName}`);
      await page.fill('#command-cmd', 'echo "vm1"');
      await page.click('button:has-text("Create Command")');
      
      await vmSelectors.nth(1).click();
      await page.click('button:has-text("Add Command")');
      await page.fill('#command-name', `VM2 - ${testCommandName}`);
      await page.fill('#command-cmd', 'echo "vm2"');
      await page.click('button:has-text("Create Command")');
      
      // Switch between VMs multiple times
      for (let i = 0; i < 3; i++) {
        await vmSelectors.nth(0).click();
        await expect(page.locator(`text=VM1 - ${testCommandName}`)).toBeVisible();
        await expect(page.locator(`text=VM2 - ${testCommandName}`)).not.toBeVisible();
        
        await vmSelectors.nth(1).click();
        await expect(page.locator(`text=VM2 - ${testCommandName}`)).toBeVisible();
        await expect(page.locator(`text=VM1 - ${testCommandName}`)).not.toBeVisible();
      }
    });

    test('should handle VM switching during command operations', async ({ page }) => {
      // Check if multiple VMs are available
      await page.waitForSelector('[data-testid="vm-selector"]', { timeout: 10000 });
      const vmSelectors = page.locator('[data-testid="vm-selector"]');
      const vmCount = await vmSelectors.count();
      
      if (vmCount < 2) {
        test.skip('Test requires at least 2 VMs');
      }
      
      // Select first VM and start creating a command
      await vmSelectors.nth(0).click();
      await page.click('button:has-text("Add Command")');
      await page.fill('#command-name', testCommandName);
      await page.fill('#command-cmd', 'echo "test"');
      
      // Switch VM while modal is open
      await vmSelectors.nth(1).click();
      
      // Modal should still be open but might show error or close
      // The exact behavior depends on implementation
      // This test verifies the app doesn't crash
      await page.waitForTimeout(1000);
      
      // Try to close modal if it's still open
      const modal = page.locator('text=Add New Command');
      if (await modal.isVisible()) {
        await page.click('button:has-text("Cancel")');
      }
      
      // Verify app is still functional
      await expect(page.locator('button:has-text("Add Command")')).toBeVisible();
    });
  });

  test.describe('Data Consistency', () => {
    test('should maintain data consistency across browser tabs', async ({ context }) => {
      // Open two tabs
      const page1 = await context.newPage();
      const page2 = await context.newPage();
      
      // Navigate both tabs to the app
      await page1.goto('/');
      await page2.goto('/');
      await page1.waitForLoadState('networkidle');
      await page2.waitForLoadState('networkidle');
      
      // Select same VM in both tabs
      await page1.waitForSelector('[data-testid="vm-selector"]', { timeout: 10000 });
      await page2.waitForSelector('[data-testid="vm-selector"]', { timeout: 10000 });
      
      const vmSelector1 = page1.locator('[data-testid="vm-selector"]').first();
      const vmSelector2 = page2.locator('[data-testid="vm-selector"]').first();
      
      if (await vmSelector1.isVisible()) await vmSelector1.click();
      if (await vmSelector2.isVisible()) await vmSelector2.click();
      
      // Create a command in tab 1
      await page1.click('button:has-text("Add Command")');
      await page1.fill('#command-name', testCommandName);
      await page1.fill('#command-cmd', 'echo "tab test"');
      await page1.click('button:has-text("Create Command")');
      await expect(page1.locator(`text=${testCommandName}`)).toBeVisible();
      
      // Refresh tab 2 and verify command appears
      await page2.reload();
      await page2.waitForLoadState('networkidle');
      
      // Re-select VM in tab 2
      await page2.waitForSelector('[data-testid="vm-selector"]', { timeout: 10000 });
      const vmSelector2AfterRefresh = page2.locator('[data-testid="vm-selector"]').first();
      if (await vmSelector2AfterRefresh.isVisible()) {
        await vmSelector2AfterRefresh.click();
      }
      
      // Verify command is visible in tab 2
      await expect(page2.locator(`text=${testCommandName}`)).toBeVisible();
      
      await page1.close();
      await page2.close();
    });

    test('should handle concurrent operations gracefully', async ({ page }) => {
      // Select a VM
      await page.waitForSelector('[data-testid="vm-selector"]', { timeout: 10000 });
      const vmSelector = page.locator('[data-testid="vm-selector"]').first();
      if (await vmSelector.isVisible()) {
        await vmSelector.click();
      }
      
      // Create multiple commands rapidly
      const commands = [
        { name: `${testCommandName} A`, cmd: 'echo "a"' },
        { name: `${testCommandName} B`, cmd: 'echo "b"' },
        { name: `${testCommandName} C`, cmd: 'echo "c"' }
      ];
      
      // Start all command creations without waiting
      const creationPromises = commands.map(async (command, index) => {
        await page.click('button:has-text("Add Command")');
        await page.fill('#command-name', command.name);
        await page.fill('#command-cmd', command.cmd);
        await page.click('button:has-text("Create Command")');
        // Small delay to avoid conflicts
        await page.waitForTimeout(100 * index);
      });
      
      // Wait for all to complete
      await Promise.all(creationPromises);
      
      // Verify all commands were created
      for (const command of commands) {
        await expect(page.locator(`text=${command.name}`)).toBeVisible();
      }
    });
  });
});
