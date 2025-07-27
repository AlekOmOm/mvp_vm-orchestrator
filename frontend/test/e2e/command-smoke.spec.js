import { test, expect } from '@playwright/test';

/**
 * Quick Smoke Test (5 minutes)
 * 
 * Essential functionality tests that can be run quickly to verify basic operations
 */

test.describe('Command CRUD Smoke Tests', () => {
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
    
    testCommandName = `Smoke Test ${Date.now()}`;
  });

  test('✅ Open Add Command modal → templates visible', async ({ page }) => {
    // Click Add Command button
    await page.click('button:has-text("Add Command")');
    
    // Verify modal opens
    await expect(page.locator('text=Add New Command')).toBeVisible();
    
    // Verify templates section is visible
    await expect(page.locator('text=Available Templates')).toBeVisible();
    
    // Wait for templates to load (if any)
    await page.waitForTimeout(1000);
    
    // This test passes if modal opens and templates section is visible
    // Even if no templates are available, the section should be there
  });

  test('✅ Click template → form populates (no execution)', async ({ page }) => {
    // Open Add Command modal
    await page.click('button:has-text("Add Command")');
    await expect(page.locator('text=Add New Command')).toBeVisible();
    
    // Check if templates are available
    await page.waitForTimeout(1000);
    const templates = page.locator('[data-testid="command-template"]');
    const templateCount = await templates.count();
    
    if (templateCount > 0) {
      // Monitor for execution requests (should not happen)
      const executionRequests = [];
      page.on('request', request => {
        if (request.url().includes('/execute') || request.url().includes('/jobs')) {
          executionRequests.push(request.url());
        }
      });
      
      // Click first template
      await templates.first().click();
      
      // Verify form fields are populated
      const nameInput = page.locator('#command-name');
      const cmdTextarea = page.locator('#command-cmd');
      
      await expect(nameInput).not.toHaveValue('');
      await expect(cmdTextarea).not.toHaveValue('');
      
      // Verify no execution occurred
      expect(executionRequests).toHaveLength(0);
      
      // Verify we're still in the form
      await expect(page.locator('text=Add New Command')).toBeVisible();
    } else {
      // If no templates available, just verify form is functional
      await page.fill('#command-name', 'Manual Test');
      await page.fill('#command-cmd', 'echo "manual"');
      await expect(page.locator('#command-name')).toHaveValue('Manual Test');
    }
  });

  test('✅ Create command → appears in list', async ({ page }) => {
    // Open Add Command modal
    await page.click('button:has-text("Add Command")');
    
    // Fill form manually
    await page.fill('#command-name', testCommandName);
    await page.fill('#command-cmd', 'echo "smoke test"');
    await page.selectOption('#command-type', 'ssh');
    
    // Submit
    await page.click('button:has-text("Create Command")');
    
    // Verify modal closes
    await expect(page.locator('text=Add New Command')).not.toBeVisible();
    
    // Verify command appears in list
    await expect(page.locator(`text=${testCommandName}`)).toBeVisible();
    await expect(page.locator('text=echo "smoke test"')).toBeVisible();
  });

  test('✅ Edit command → changes save', async ({ page }) => {
    // First create a command
    await page.click('button:has-text("Add Command")');
    await page.fill('#command-name', testCommandName);
    await page.fill('#command-cmd', 'echo "original"');
    await page.click('button:has-text("Create Command")');
    await expect(page.locator(`text=${testCommandName}`)).toBeVisible();
    
    // Edit the command
    const commandCard = page.locator(`text=${testCommandName}`).locator('..').locator('..');
    await commandCard.locator('button[data-testid="edit-command"]').click();
    
    // Verify edit modal opens with pre-filled data
    await expect(page.locator('text=Edit Command')).toBeVisible();
    await expect(page.locator('#name')).toHaveValue(testCommandName);
    
    // Make changes
    const updatedName = `${testCommandName} - Edited`;
    await page.fill('#name', updatedName);
    await page.fill('#cmd', 'echo "edited"');
    
    // Save changes
    await page.click('button:has-text("Update Command")');
    
    // Verify modal closes
    await expect(page.locator('text=Edit Command')).not.toBeVisible();
    
    // Verify changes are visible
    await expect(page.locator(`text=${updatedName}`)).toBeVisible();
    await expect(page.locator('text=echo "edited"')).toBeVisible();
    await expect(page.locator(`text=${testCommandName}`)).not.toBeVisible(); // Original name gone
  });

  test('✅ Delete command → disappears from list', async ({ page }) => {
    // First create a command
    await page.click('button:has-text("Add Command")');
    await page.fill('#command-name', testCommandName);
    await page.fill('#command-cmd', 'echo "to delete"');
    await page.click('button:has-text("Create Command")');
    await expect(page.locator(`text=${testCommandName}`)).toBeVisible();
    
    // Delete the command
    const commandCard = page.locator(`text=${testCommandName}`).locator('..').locator('..');
    await commandCard.locator('button[data-testid="delete-command"]').click();
    
    // Verify delete confirmation modal
    await expect(page.locator('text=Delete Command')).toBeVisible();
    await expect(page.locator('text=Are you sure you want to delete this command?')).toBeVisible();
    
    // Confirm deletion
    await page.click('button:has-text("Delete Command")');
    
    // Verify modal closes
    await expect(page.locator('text=Delete Command')).not.toBeVisible();
    
    // Verify command is gone
    await expect(page.locator(`text=${testCommandName}`)).not.toBeVisible();
  });

  test('🚀 Full CRUD workflow in one test', async ({ page }) => {
    const baseName = `Full Test ${Date.now()}`;
    
    // CREATE
    await page.click('button:has-text("Add Command")');
    await page.fill('#command-name', baseName);
    await page.fill('#command-cmd', 'echo "step1"');
    await page.click('button:has-text("Create Command")');
    await expect(page.locator(`text=${baseName}`)).toBeVisible();
    
    // READ (verify it's in the list)
    await expect(page.locator('text=echo "step1"')).toBeVisible();
    
    // UPDATE
    const commandCard = page.locator(`text=${baseName}`).locator('..').locator('..');
    await commandCard.locator('button[data-testid="edit-command"]').click();
    const updatedName = `${baseName} - Updated`;
    await page.fill('#name', updatedName);
    await page.fill('#cmd', 'echo "step2"');
    await page.click('button:has-text("Update Command")');
    await expect(page.locator(`text=${updatedName}`)).toBeVisible();
    await expect(page.locator('text=echo "step2"')).toBeVisible();
    
    // DELETE
    const updatedCommandCard = page.locator(`text=${updatedName}`).locator('..').locator('..');
    await updatedCommandCard.locator('button[data-testid="delete-command"]').click();
    await page.click('button:has-text("Delete Command")');
    await expect(page.locator(`text=${updatedName}`)).not.toBeVisible();
    
    // Verify complete cleanup
    await expect(page.locator(`text=${baseName}`)).not.toBeVisible();
  });

  test('🔧 Basic error handling', async ({ page }) => {
    // Test validation errors
    await page.click('button:has-text("Add Command")');
    
    // Try to submit empty form
    await page.click('button:has-text("Create Command")');
    await expect(page.locator('text=Name and command are required')).toBeVisible();
    
    // Fill only name
    await page.fill('#command-name', 'Test Name');
    await page.click('button:has-text("Create Command")');
    await expect(page.locator('text=Name and command are required')).toBeVisible();
    
    // Fill both required fields
    await page.fill('#command-cmd', 'echo "test"');
    await page.click('button:has-text("Create Command")');
    
    // Should succeed now
    await expect(page.locator('text=Add New Command')).not.toBeVisible();
    await expect(page.locator('text=Test Name')).toBeVisible();
  });

  test('📱 Basic responsive check', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Verify main elements are still accessible
    await expect(page.locator('button:has-text("Add Command")')).toBeVisible();
    
    // Open modal and verify it works on mobile
    await page.click('button:has-text("Add Command")');
    await expect(page.locator('text=Add New Command')).toBeVisible();
    await expect(page.locator('#command-name')).toBeVisible();
    await expect(page.locator('button:has-text("Create Command")')).toBeVisible();
    
    // Close modal
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('text=Add New Command')).not.toBeVisible();
  });
});

// Quick health check test that runs first
test.describe.serial('Health Check', () => {
  test('🏥 Application loads and basic UI is present', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify basic UI elements are present
    await expect(page.locator('body')).toBeVisible();
    
    // Look for VM selector or main navigation
    const hasVMSelector = await page.locator('[data-testid="vm-selector"]').count() > 0;
    const hasAddButton = await page.locator('button:has-text("Add Command")').count() > 0;
    
    // At least one of these should be present
    expect(hasVMSelector || hasAddButton).toBeTruthy();
  });
});
