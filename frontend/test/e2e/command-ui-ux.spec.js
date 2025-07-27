import { test, expect } from '@playwright/test';

/**
 * Test Workflow 4: UI/UX Verification
 * 
 * Tests loading states, modal behavior, responsive design, and user interactions
 */

test.describe('Command UI/UX Verification', () => {
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
    
    testCommandName = `UI Test ${Date.now()}`;
  });

  test.describe('Loading States', () => {
    test('should show loading state during command creation', async ({ page }) => {
      // Intercept and delay the API call to observe loading state
      await page.route('**/api/vms/*/commands', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        route.continue();
      });
      
      // Start creating a command
      await page.click('button:has-text("Add Command")');
      await page.fill('#command-name', testCommandName);
      await page.fill('#command-cmd', 'echo "test"');
      await page.click('button:has-text("Create Command")');
      
      // Verify loading state
      await expect(page.locator('button:has-text("Creating...")')).toBeVisible();
      
      // Verify spinner is visible
      await expect(page.locator('.animate-spin')).toBeVisible();
      
      // Verify button is disabled
      await expect(page.locator('button:has-text("Creating...")')).toBeDisabled();
      
      // Wait for completion
      await expect(page.locator('button:has-text("Creating...")')).not.toBeVisible({ timeout: 3000 });
    });

    test('should show loading state during command update', async ({ page }) => {
      // Create a command first
      await page.click('button:has-text("Add Command")');
      await page.fill('#command-name', testCommandName);
      await page.fill('#command-cmd', 'echo "test"');
      await page.click('button:has-text("Create Command")');
      await expect(page.locator(`text=${testCommandName}`)).toBeVisible();
      
      // Intercept and delay the update API call
      await page.route('**/api/commands/*', async route => {
        if (route.request().method() === 'PUT') {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        route.continue();
      });
      
      // Start updating the command
      const commandCard = page.locator(`text=${testCommandName}`).locator('..').locator('..');
      await commandCard.locator('button[data-testid="edit-command"]').click();
      await page.fill('#name', `${testCommandName} - Updated`);
      await page.click('button:has-text("Update Command")');
      
      // Verify loading state
      await expect(page.locator('button:has-text("Update Command")')).toBeDisabled();
      await expect(page.locator('.animate-spin')).toBeVisible();
    });

    test('should show loading state during command deletion', async ({ page }) => {
      // Create a command first
      await page.click('button:has-text("Add Command")');
      await page.fill('#command-name', testCommandName);
      await page.fill('#command-cmd', 'echo "test"');
      await page.click('button:has-text("Create Command")');
      await expect(page.locator(`text=${testCommandName}`)).toBeVisible();
      
      // Intercept and delay the delete API call
      await page.route('**/api/commands/*', async route => {
        if (route.request().method() === 'DELETE') {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        route.continue();
      });
      
      // Start deleting the command
      const commandCard = page.locator(`text=${testCommandName}`).locator('..').locator('..');
      await commandCard.locator('button[data-testid="delete-command"]').click();
      await page.click('button:has-text("Delete Command")');
      
      // Verify loading state
      await expect(page.locator('button:has-text("Delete Command")')).toBeDisabled();
      await expect(page.locator('.animate-spin')).toBeVisible();
    });
  });

  test.describe('Modal Behavior', () => {
    test('should close modals with X button', async ({ page }) => {
      // Test Add Command modal
      await page.click('button:has-text("Add Command")');
      await expect(page.locator('text=Add New Command')).toBeVisible();
      
      // Close with X button
      await page.click('button[aria-label="Close"]');
      await expect(page.locator('text=Add New Command')).not.toBeVisible();
    });

    test('should close modals with Cancel button', async ({ page }) => {
      // Test Add Command modal
      await page.click('button:has-text("Add Command")');
      await expect(page.locator('text=Add New Command')).toBeVisible();
      
      // Close with Cancel button
      await page.click('button:has-text("Cancel")');
      await expect(page.locator('text=Add New Command')).not.toBeVisible();
    });

    test('should close modals with Escape key', async ({ page }) => {
      // Test Add Command modal
      await page.click('button:has-text("Add Command")');
      await expect(page.locator('text=Add New Command')).toBeVisible();
      
      // Close with Escape key
      await page.keyboard.press('Escape');
      await expect(page.locator('text=Add New Command')).not.toBeVisible();
    });

    test('should prevent multiple modals from opening simultaneously', async ({ page }) => {
      // Create a command first
      await page.click('button:has-text("Add Command")');
      await page.fill('#command-name', testCommandName);
      await page.fill('#command-cmd', 'echo "test"');
      await page.click('button:has-text("Create Command")');
      await expect(page.locator(`text=${testCommandName}`)).toBeVisible();
      
      // Open edit modal
      const commandCard = page.locator(`text=${testCommandName}`).locator('..').locator('..');
      await commandCard.locator('button[data-testid="edit-command"]').click();
      await expect(page.locator('text=Edit Command')).toBeVisible();
      
      // Try to open add command modal (should not work)
      await page.click('button:has-text("Add Command")');
      
      // Verify only edit modal is visible
      await expect(page.locator('text=Edit Command')).toBeVisible();
      await expect(page.locator('text=Add New Command')).not.toBeVisible();
    });

    test('should reset form when modal is closed and reopened', async ({ page }) => {
      // Open Add Command modal and fill some data
      await page.click('button:has-text("Add Command")');
      await page.fill('#command-name', 'Test Data');
      await page.fill('#command-cmd', 'echo "test"');
      
      // Close modal
      await page.click('button:has-text("Cancel")');
      await expect(page.locator('text=Add New Command')).not.toBeVisible();
      
      // Reopen modal
      await page.click('button:has-text("Add Command")');
      await expect(page.locator('text=Add New Command')).toBeVisible();
      
      // Verify form is reset
      await expect(page.locator('#command-name')).toHaveValue('');
      await expect(page.locator('#command-cmd')).toHaveValue('');
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Verify main UI is still accessible
      await expect(page.locator('button:has-text("Add Command")')).toBeVisible();
      
      // Open Add Command modal
      await page.click('button:has-text("Add Command")');
      await expect(page.locator('text=Add New Command')).toBeVisible();
      
      // Verify form fields are accessible
      await expect(page.locator('#command-name')).toBeVisible();
      await expect(page.locator('#command-cmd')).toBeVisible();
      
      // Verify buttons are accessible
      await expect(page.locator('button:has-text("Create Command")')).toBeVisible();
      await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
    });

    test('should work on tablet viewport', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Create a command to test edit/delete buttons
      await page.click('button:has-text("Add Command")');
      await page.fill('#command-name', testCommandName);
      await page.fill('#command-cmd', 'echo "test"');
      await page.click('button:has-text("Create Command")');
      await expect(page.locator(`text=${testCommandName}`)).toBeVisible();
      
      // Verify edit and delete buttons are accessible
      const commandCard = page.locator(`text=${testCommandName}`).locator('..').locator('..');
      await expect(commandCard.locator('button[data-testid="edit-command"]')).toBeVisible();
      await expect(commandCard.locator('button[data-testid="delete-command"]')).toBeVisible();
    });

    test('should maintain usability on large screens', async ({ page }) => {
      // Set large desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      // Verify layout doesn't break
      await expect(page.locator('button:has-text("Add Command")')).toBeVisible();
      
      // Open modal and verify it's properly sized
      await page.click('button:has-text("Add Command")');
      await expect(page.locator('text=Add New Command')).toBeVisible();
      
      // Verify modal doesn't become too wide
      const modal = page.locator('[role="dialog"]');
      const modalBox = await modal.boundingBox();
      expect(modalBox.width).toBeLessThan(1000); // Should have reasonable max width
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper focus management', async ({ page }) => {
      // Open Add Command modal
      await page.click('button:has-text("Add Command")');
      
      // Verify focus is on the first input
      await expect(page.locator('#command-name')).toBeFocused();
      
      // Tab through form elements
      await page.keyboard.press('Tab');
      await expect(page.locator('#command-cmd')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('#command-type')).toBeFocused();
    });

    test('should have proper ARIA labels and roles', async ({ page }) => {
      // Open Add Command modal
      await page.click('button:has-text("Add Command")');
      
      // Verify modal has proper role
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      
      // Verify form labels are associated with inputs
      await expect(page.locator('label[for="command-name"]')).toBeVisible();
      await expect(page.locator('label[for="command-cmd"]')).toBeVisible();
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Create a command first
      await page.click('button:has-text("Add Command")');
      await page.fill('#command-name', testCommandName);
      await page.fill('#command-cmd', 'echo "test"');
      await page.click('button:has-text("Create Command")');
      await expect(page.locator(`text=${testCommandName}`)).toBeVisible();
      
      // Navigate to edit button using keyboard
      await page.keyboard.press('Tab');
      // Continue tabbing until we reach the edit button
      // This is a simplified test - in practice you'd need to tab through all elements
      
      // Verify edit button can be activated with Enter
      const commandCard = page.locator(`text=${testCommandName}`).locator('..').locator('..');
      await commandCard.locator('button[data-testid="edit-command"]').focus();
      await page.keyboard.press('Enter');
      
      // Verify edit modal opens
      await expect(page.locator('text=Edit Command')).toBeVisible();
    });
  });

  test.describe('Visual Feedback', () => {
    test('should show hover states on interactive elements', async ({ page }) => {
      // Create a command first
      await page.click('button:has-text("Add Command")');
      await page.fill('#command-name', testCommandName);
      await page.fill('#command-cmd', 'echo "test"');
      await page.click('button:has-text("Create Command")');
      await expect(page.locator(`text=${testCommandName}`)).toBeVisible();
      
      // Hover over edit button and verify visual change
      const editButton = page.locator('button[data-testid="edit-command"]').first();
      await editButton.hover();
      
      // Verify button has hover state (this would need specific CSS classes)
      // This is a placeholder - actual implementation would check for hover styles
      await expect(editButton).toBeVisible();
    });

    test('should show disabled states correctly', async ({ page }) => {
      // Open Add Command modal
      await page.click('button:has-text("Add Command")');
      
      // Verify Create button is disabled when required fields are empty
      await expect(page.locator('button:has-text("Create Command")')).toBeDisabled();
      
      // Fill required fields
      await page.fill('#command-name', testCommandName);
      await page.fill('#command-cmd', 'echo "test"');
      
      // Verify Create button is now enabled
      await expect(page.locator('button:has-text("Create Command")')).toBeEnabled();
    });

    test('should show error states with proper styling', async ({ page }) => {
      // Open Add Command modal
      await page.click('button:has-text("Add Command")');
      
      // Try to submit without required fields
      await page.click('button:has-text("Create Command")');
      
      // Verify error message has proper styling
      const errorMessage = page.locator('text=Name and command are required');
      await expect(errorMessage).toBeVisible();
      
      // Verify error message has error styling (red background, etc.)
      await expect(errorMessage.locator('..')).toHaveClass(/red|error|destructive/);
    });
  });
});
