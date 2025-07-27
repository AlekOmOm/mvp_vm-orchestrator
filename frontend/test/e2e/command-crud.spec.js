import { test, expect } from '@playwright/test';

/**
 * Test Workflow 2: CRUD Operations for Commands
 * 
 * Tests CREATE, READ, UPDATE, DELETE operations for VM commands
 */

test.describe('Command CRUD Operations', () => {
  let testCommandName = '';

  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Select a VM (adjust selector based on actual implementation)
    await page.waitForSelector('[data-testid="vm-selector"]', { timeout: 10000 });
    const vmSelector = page.locator('[data-testid="vm-selector"]').first();
    if (await vmSelector.isVisible()) {
      await vmSelector.click();
    }
    
    // Generate unique test command name
    testCommandName = `Test Command ${Date.now()}`;
  });

  test.describe('CREATE Commands', () => {
    test('should create a new command successfully', async ({ page }) => {
      // Click Add Command button
      await page.click('button:has-text("Add Command")');
      await expect(page.locator('text=Add New Command')).toBeVisible();
      
      // Fill out the form manually (not using templates)
      await page.fill('#command-name', testCommandName);
      await page.fill('#command-cmd', 'echo "Hello World"');
      await page.selectOption('#command-type', 'ssh');
      await page.fill('#command-description', 'Test command for E2E testing');
      await page.fill('#command-timeout', '30000');
      
      // Submit the form
      await page.click('button:has-text("Create Command")');
      
      // Verify modal closes
      await expect(page.locator('text=Add New Command')).not.toBeVisible();
      
      // Verify command appears in the list
      await expect(page.locator(`text=${testCommandName}`)).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
      // Open Add Command modal
      await page.click('button:has-text("Add Command")');
      await expect(page.locator('text=Add New Command')).toBeVisible();
      
      // Try to submit without required fields
      await page.click('button:has-text("Create Command")');
      
      // Verify error message appears
      await expect(page.locator('text=Name and command are required')).toBeVisible();
      
      // Verify modal stays open
      await expect(page.locator('text=Add New Command')).toBeVisible();
    });
  });

  test.describe('READ Commands', () => {
    test.beforeEach(async ({ page }) => {
      // Create a test command first
      await page.click('button:has-text("Add Command")');
      await page.fill('#command-name', testCommandName);
      await page.fill('#command-cmd', 'echo "Test"');
      await page.click('button:has-text("Create Command")');
      await expect(page.locator(`text=${testCommandName}`)).toBeVisible();
    });

    test('should display commands list correctly', async ({ page }) => {
      // Verify command is visible in the list
      await expect(page.locator(`text=${testCommandName}`)).toBeVisible();
      
      // Verify command has edit and delete buttons
      const commandCard = page.locator(`text=${testCommandName}`).locator('..').locator('..');
      await expect(commandCard.locator('button[data-testid="edit-command"]')).toBeVisible();
      await expect(commandCard.locator('button[data-testid="delete-command"]')).toBeVisible();
      
      // Verify execute button is present
      await expect(commandCard.locator('button:has-text("Execute")')).toBeVisible();
    });

    test('should show command details correctly', async ({ page }) => {
      // Find the command card
      const commandCard = page.locator(`text=${testCommandName}`).locator('..').locator('..');
      
      // Verify command type badge is visible
      await expect(commandCard.locator('text=ssh')).toBeVisible();
      
      // Verify command text is displayed
      await expect(commandCard.locator('text=echo "Test"')).toBeVisible();
    });
  });

  test.describe('UPDATE Commands', () => {
    test.beforeEach(async ({ page }) => {
      // Create a test command first
      await page.click('button:has-text("Add Command")');
      await page.fill('#command-name', testCommandName);
      await page.fill('#command-cmd', 'echo "Original"');
      await page.fill('#command-description', 'Original description');
      await page.click('button:has-text("Create Command")');
      await expect(page.locator(`text=${testCommandName}`)).toBeVisible();
    });

    test('should open edit modal with pre-filled data', async ({ page }) => {
      // Click edit button
      const commandCard = page.locator(`text=${testCommandName}`).locator('..').locator('..');
      await commandCard.locator('button[data-testid="edit-command"]').click();
      
      // Verify edit modal opens
      await expect(page.locator('text=Edit Command')).toBeVisible();
      
      // Verify form is pre-filled with existing data
      await expect(page.locator('#name')).toHaveValue(testCommandName);
      await expect(page.locator('#cmd')).toHaveValue('echo "Original"');
      await expect(page.locator('#description')).toHaveValue('Original description');
    });

    test('should update command successfully', async ({ page }) => {
      // Open edit modal
      const commandCard = page.locator(`text=${testCommandName}`).locator('..').locator('..');
      await commandCard.locator('button[data-testid="edit-command"]').click();
      
      // Update the command
      const updatedName = `${testCommandName} - Updated`;
      await page.fill('#name', updatedName);
      await page.fill('#cmd', 'echo "Updated"');
      await page.fill('#description', 'Updated description');
      
      // Submit the update
      await page.click('button:has-text("Update Command")');
      
      // Verify modal closes
      await expect(page.locator('text=Edit Command')).not.toBeVisible();
      
      // Verify updated command appears in list
      await expect(page.locator(`text=${updatedName}`)).toBeVisible();
      await expect(page.locator('text=echo "Updated"')).toBeVisible();
    });

    test('should validate required fields in edit form', async ({ page }) => {
      // Open edit modal
      const commandCard = page.locator(`text=${testCommandName}`).locator('..').locator('..');
      await commandCard.locator('button[data-testid="edit-command"]').click();
      
      // Clear required fields
      await page.fill('#name', '');
      await page.fill('#cmd', '');
      
      // Try to submit
      await page.click('button:has-text("Update Command")');
      
      // Verify error message
      await expect(page.locator('text=Name and command are required')).toBeVisible();
      
      // Verify modal stays open
      await expect(page.locator('text=Edit Command')).toBeVisible();
    });

    test('should cancel edit without saving changes', async ({ page }) => {
      // Open edit modal
      const commandCard = page.locator(`text=${testCommandName}`).locator('..').locator('..');
      await commandCard.locator('button[data-testid="edit-command"]').click();
      
      // Make changes
      await page.fill('#name', 'Should Not Save');
      
      // Cancel
      await page.click('button:has-text("Cancel")');
      
      // Verify modal closes
      await expect(page.locator('text=Edit Command')).not.toBeVisible();
      
      // Verify original command is still there
      await expect(page.locator(`text=${testCommandName}`)).toBeVisible();
      await expect(page.locator('text=Should Not Save')).not.toBeVisible();
    });
  });

  test.describe('DELETE Commands', () => {
    test.beforeEach(async ({ page }) => {
      // Create a test command first
      await page.click('button:has-text("Add Command")');
      await page.fill('#command-name', testCommandName);
      await page.fill('#command-cmd', 'echo "To Delete"');
      await page.click('button:has-text("Create Command")');
      await expect(page.locator(`text=${testCommandName}`)).toBeVisible();
    });

    test('should open delete confirmation modal', async ({ page }) => {
      // Click delete button
      const commandCard = page.locator(`text=${testCommandName}`).locator('..').locator('..');
      await commandCard.locator('button[data-testid="delete-command"]').click();
      
      // Verify confirmation modal opens
      await expect(page.locator('text=Delete Command')).toBeVisible();
      await expect(page.locator('text=Are you sure you want to delete this command?')).toBeVisible();
      
      // Verify command details are shown in confirmation
      await expect(page.locator(`text=${testCommandName}`)).toBeVisible();
      await expect(page.locator('text=echo "To Delete"')).toBeVisible();
    });

    test('should cancel delete operation', async ({ page }) => {
      // Open delete confirmation
      const commandCard = page.locator(`text=${testCommandName}`).locator('..').locator('..');
      await commandCard.locator('button[data-testid="delete-command"]').click();
      
      // Cancel deletion
      await page.click('button:has-text("Cancel")');
      
      // Verify modal closes
      await expect(page.locator('text=Delete Command')).not.toBeVisible();
      
      // Verify command is still in the list
      await expect(page.locator(`text=${testCommandName}`)).toBeVisible();
    });

    test('should delete command successfully', async ({ page }) => {
      // Open delete confirmation
      const commandCard = page.locator(`text=${testCommandName}`).locator('..').locator('..');
      await commandCard.locator('button[data-testid="delete-command"]').click();
      
      // Confirm deletion
      await page.click('button:has-text("Delete Command")');
      
      // Verify modal closes
      await expect(page.locator('text=Delete Command')).not.toBeVisible();
      
      // Verify command is removed from the list
      await expect(page.locator(`text=${testCommandName}`)).not.toBeVisible();
    });
  });
});
