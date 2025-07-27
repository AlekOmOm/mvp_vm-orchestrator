import { test, expect } from '@playwright/test';

/**
 * Test Workflow 3: Error Handling
 * 
 * Tests network errors, validation errors, and edge cases
 */

test.describe('Command Error Handling', () => {
  let testCommandName = '';

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Select a VM
    await page.waitForSelector('[data-testid="vm-selector"]', { timeout: 10000 });
    const vmSelector = page.locator('[data-testid="vm-selector"]').first();
    if (await vmSelector.isVisible()) {
      await vmSelector.click();
    }
    
    testCommandName = `Error Test ${Date.now()}`;
  });

  test.describe('Network Error Handling', () => {
    test('should handle API failure during command creation', async ({ page }) => {
      // Intercept and fail the create command API call
      await page.route('**/api/vms/*/commands', route => {
        route.abort('failed');
      });
      
      // Try to create a command
      await page.click('button:has-text("Add Command")');
      await page.fill('#command-name', testCommandName);
      await page.fill('#command-cmd', 'echo "test"');
      await page.click('button:has-text("Create Command")');
      
      // Verify error message appears
      await expect(page.locator('text=Failed to create command')).toBeVisible();
      
      // Verify modal stays open for retry
      await expect(page.locator('text=Add New Command')).toBeVisible();
      
      // Verify loading state clears
      await expect(page.locator('button:has-text("Creating...")')).not.toBeVisible();
    });

    test('should handle API failure during command update', async ({ page }) => {
      // First create a command successfully
      await page.click('button:has-text("Add Command")');
      await page.fill('#command-name', testCommandName);
      await page.fill('#command-cmd', 'echo "test"');
      await page.click('button:has-text("Create Command")');
      await expect(page.locator(`text=${testCommandName}`)).toBeVisible();
      
      // Intercept and fail the update API call
      await page.route('**/api/commands/*', route => {
        if (route.request().method() === 'PUT') {
          route.abort('failed');
        } else {
          route.continue();
        }
      });
      
      // Try to update the command
      const commandCard = page.locator(`text=${testCommandName}`).locator('..').locator('..');
      await commandCard.locator('button[data-testid="edit-command"]').click();
      await page.fill('#name', `${testCommandName} - Updated`);
      await page.click('button:has-text("Update Command")');
      
      // Verify error message appears
      await expect(page.locator('text=Failed to update command')).toBeVisible();
      
      // Verify modal stays open
      await expect(page.locator('text=Edit Command')).toBeVisible();
    });

    test('should handle API failure during command deletion', async ({ page }) => {
      // First create a command successfully
      await page.click('button:has-text("Add Command")');
      await page.fill('#command-name', testCommandName);
      await page.fill('#command-cmd', 'echo "test"');
      await page.click('button:has-text("Create Command")');
      await expect(page.locator(`text=${testCommandName}`)).toBeVisible();
      
      // Intercept and fail the delete API call
      await page.route('**/api/commands/*', route => {
        if (route.request().method() === 'DELETE') {
          route.abort('failed');
        } else {
          route.continue();
        }
      });
      
      // Try to delete the command
      const commandCard = page.locator(`text=${testCommandName}`).locator('..').locator('..');
      await commandCard.locator('button[data-testid="delete-command"]').click();
      await page.click('button:has-text("Delete Command")');
      
      // Verify error message appears in the main UI (not in modal)
      await expect(page.locator('text=Failed to delete command')).toBeVisible();
      
      // Verify command is still in the list
      await expect(page.locator(`text=${testCommandName}`)).toBeVisible();
    });

    test('should handle slow API responses with loading states', async ({ page }) => {
      // Intercept and delay the create command API call
      await page.route('**/api/vms/*/commands', async route => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        route.continue();
      });
      
      // Try to create a command
      await page.click('button:has-text("Add Command")');
      await page.fill('#command-name', testCommandName);
      await page.fill('#command-cmd', 'echo "test"');
      await page.click('button:has-text("Create Command")');
      
      // Verify loading state appears
      await expect(page.locator('button:has-text("Creating...")')).toBeVisible();
      
      // Verify button is disabled during loading
      await expect(page.locator('button:has-text("Creating...")').first()).toBeDisabled();
      
      // Wait for completion
      await expect(page.locator('button:has-text("Creating...")')).not.toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Validation Error Handling', () => {
    test('should handle empty required fields', async ({ page }) => {
      // Open Add Command modal
      await page.click('button:has-text("Add Command")');
      
      // Try to submit with empty fields
      await page.click('button:has-text("Create Command")');
      
      // Verify error message
      await expect(page.locator('text=Name and command are required')).toBeVisible();
      
      // Verify form stays open
      await expect(page.locator('text=Add New Command')).toBeVisible();
      
      // Verify submit button remains enabled for retry
      await expect(page.locator('button:has-text("Create Command")')).toBeEnabled();
    });

    test('should handle whitespace-only input', async ({ page }) => {
      // Open Add Command modal
      await page.click('button:has-text("Add Command")');
      
      // Fill with whitespace only
      await page.fill('#command-name', '   ');
      await page.fill('#command-cmd', '   ');
      
      // Try to submit
      await page.click('button:has-text("Create Command")');
      
      // Verify error message (trimmed values should be empty)
      await expect(page.locator('text=Name and command are required')).toBeVisible();
    });

    test('should handle extremely long input values', async ({ page }) => {
      // Open Add Command modal
      await page.click('button:has-text("Add Command")');
      
      // Fill with very long values
      const longName = 'A'.repeat(1000);
      const longCommand = 'echo "' + 'B'.repeat(5000) + '"';
      
      await page.fill('#command-name', longName);
      await page.fill('#command-cmd', longCommand);
      
      // Try to submit
      await page.click('button:has-text("Create Command")');
      
      // The form should either accept it or show appropriate validation
      // This test verifies the app doesn't crash with long input
      await page.waitForTimeout(1000);
      
      // Verify the page is still responsive
      await expect(page.locator('text=Add New Command')).toBeVisible();
    });

    test('should handle invalid timeout values', async ({ page }) => {
      // Open Add Command modal
      await page.click('button:has-text("Add Command")');
      
      // Fill valid required fields
      await page.fill('#command-name', testCommandName);
      await page.fill('#command-cmd', 'echo "test"');
      
      // Set invalid timeout (negative value)
      await page.fill('#command-timeout', '-1000');
      
      // Try to submit
      await page.click('button:has-text("Create Command")');
      
      // The HTML5 validation should prevent submission or show error
      // Verify form is still open (submission was prevented)
      await expect(page.locator('text=Add New Command')).toBeVisible();
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle special characters in command names', async ({ page }) => {
      const specialName = 'Test & Command "with" <special> chars';
      
      // Create command with special characters
      await page.click('button:has-text("Add Command")');
      await page.fill('#command-name', specialName);
      await page.fill('#command-cmd', 'echo "test"');
      await page.click('button:has-text("Create Command")');
      
      // Verify command is created and displayed correctly
      await expect(page.locator(`text=${specialName}`)).toBeVisible();
    });

    test('should handle commands with complex shell syntax', async ({ page }) => {
      const complexCommand = 'ps aux | grep node | awk \'{print $2}\' | head -5';
      
      // Create command with complex shell syntax
      await page.click('button:has-text("Add Command")');
      await page.fill('#command-name', testCommandName);
      await page.fill('#command-cmd', complexCommand);
      await page.click('button:has-text("Create Command")');
      
      // Verify command is created
      await expect(page.locator(`text=${testCommandName}`)).toBeVisible();
      
      // Verify complex command is displayed (might be truncated in UI)
      await expect(page.locator('text=ps aux')).toBeVisible();
    });

    test('should handle rapid successive operations', async ({ page }) => {
      // Create a command
      await page.click('button:has-text("Add Command")');
      await page.fill('#command-name', testCommandName);
      await page.fill('#command-cmd', 'echo "test"');
      await page.click('button:has-text("Create Command")');
      await expect(page.locator(`text=${testCommandName}`)).toBeVisible();
      
      // Rapidly try to edit and delete
      const commandCard = page.locator(`text=${testCommandName}`).locator('..').locator('..');
      
      // Click edit quickly
      await commandCard.locator('button[data-testid="edit-command"]').click();
      
      // Immediately cancel and try delete
      await page.click('button:has-text("Cancel")');
      await commandCard.locator('button[data-testid="delete-command"]').click();
      
      // Cancel delete
      await page.click('button:has-text("Cancel")');
      
      // Verify command is still there and UI is stable
      await expect(page.locator(`text=${testCommandName}`)).toBeVisible();
    });

    test('should handle browser refresh during operations', async ({ page }) => {
      // Create a command
      await page.click('button:has-text("Add Command")');
      await page.fill('#command-name', testCommandName);
      await page.fill('#command-cmd', 'echo "test"');
      await page.click('button:has-text("Create Command")');
      await expect(page.locator(`text=${testCommandName}`)).toBeVisible();
      
      // Refresh the page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Re-select VM if needed
      await page.waitForSelector('[data-testid="vm-selector"]', { timeout: 10000 });
      const vmSelector = page.locator('[data-testid="vm-selector"]').first();
      if (await vmSelector.isVisible()) {
        await vmSelector.click();
      }
      
      // Verify command persisted after refresh
      await expect(page.locator(`text=${testCommandName}`)).toBeVisible();
    });
  });
});
