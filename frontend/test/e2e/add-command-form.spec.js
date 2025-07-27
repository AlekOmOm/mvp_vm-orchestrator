import { test, expect } from "@playwright/test";

/**
 * Test Workflow 1: Fix AddCommandForm Template Selection
 *
 * Issue: Clicking templates tries to execute commands instead of adding them
 * Expected: Templates should populate the form for creating new commands
 */

test.describe("AddCommandForm Template Selection", () => {
   test.beforeEach(async ({ page }) => {
      // Navigate to the application
      await page.goto("/");

      // Wait for the application to load
      await page.waitForLoadState("networkidle");

      // Try to select a VM if VM selector is visible
      // Look for common VM selection patterns
      const vmSelectors = [
         'select[name*="vm"]',
         'button:has-text("Select VM")',
         ".vm-selector",
         '[class*="vm-select"]',
      ];

      for (const selector of vmSelectors) {
         const element = page.locator(selector).first();
         if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
            await element.click();
            break;
         }
      }
   });

   test("should open Add Command modal with templates", async ({ page }) => {
      // Click the "Add Command" button
      await page.click('button:has-text("Add Command")');

      // Verify the modal opens
      await expect(page.locator("text=Add New Command")).toBeVisible();

      // Verify templates section is visible
      await expect(page.locator("text=Available Templates")).toBeVisible();

      // Wait for templates to load (look for template cards)
      const templateSelectors = [
         '.cursor-pointer:has-text("Local")',
         '.cursor-pointer:has-text("SSH")',
         'div:has-text("vm-status")',
         'div:has-text("docker")',
         '[class*="template"]',
         ".hover\\:shadow-md",
      ];

      let templatesFound = false;
      for (const selector of templateSelectors) {
         if (
            await page
               .locator(selector)
               .first()
               .isVisible({ timeout: 1000 })
               .catch(() => false)
         ) {
            templatesFound = true;
            break;
         }
      }

      if (!templatesFound) {
         console.log(
            "No templates found - this is OK if no templates are configured"
         );
      }
   });

   test("should populate form when template is clicked", async ({ page }) => {
      // Open Add Command modal
      await page.click('button:has-text("Add Command")');
      await expect(page.locator("text=Add New Command")).toBeVisible();

      // Wait for templates to load
      await page.waitForSelector('[data-testid="command-template"]', {
         timeout: 5000,
      });

      // Click on the first available template
      const firstTemplate = page
         .locator('[data-testid="command-template"]')
         .first();
      await firstTemplate.click();

      // Verify form fields are populated
      const nameInput = page.locator("#command-name");
      const cmdTextarea = page.locator("#command-cmd");

      // Check that fields are not empty after template selection
      await expect(nameInput).not.toHaveValue("");
      await expect(cmdTextarea).not.toHaveValue("");

      // Verify no command execution occurred (no WebSocket messages)
      // This is checked by ensuring we're still in the form, not seeing execution logs
      await expect(page.locator("text=Add New Command")).toBeVisible();
   });

   test("should not execute commands when template is selected", async ({
      page,
   }) => {
      // Monitor network requests to ensure no execution API calls
      const executionRequests = [];
      page.on("request", (request) => {
         if (
            request.url().includes("/execute") ||
            request.url().includes("/jobs")
         ) {
            executionRequests.push(request.url());
         }
      });

      // Open Add Command modal
      await page.click('button:has-text("Add Command")');
      await expect(page.locator("text=Add New Command")).toBeVisible();

      // Wait for templates and click one
      await page.waitForSelector('[data-testid="command-template"]', {
         timeout: 5000,
      });
      const firstTemplate = page
         .locator('[data-testid="command-template"]')
         .first();
      await firstTemplate.click();

      // Wait a moment to ensure no delayed execution
      await page.waitForTimeout(1000);

      // Verify no execution requests were made
      expect(executionRequests).toHaveLength(0);

      // Verify we're still in the form (not showing execution results)
      await expect(page.locator("text=Add New Command")).toBeVisible();
      await expect(
         page.locator('button:has-text("Create Command")')
      ).toBeVisible();
   });

   test("should successfully create command after template selection", async ({
      page,
   }) => {
      // Open Add Command modal
      await page.click('button:has-text("Add Command")');
      await expect(page.locator("text=Add New Command")).toBeVisible();

      // Select a template
      await page.waitForSelector('[data-testid="command-template"]', {
         timeout: 5000,
      });
      const firstTemplate = page
         .locator('[data-testid="command-template"]')
         .first();
      await firstTemplate.click();

      // Optionally modify the command name to make it unique
      const nameInput = page.locator("#command-name");
      const originalName = await nameInput.inputValue();
      await nameInput.fill(`${originalName} - Test`);

      // Submit the form
      await page.click('button:has-text("Create Command")');

      // Verify modal closes
      await expect(page.locator("text=Add New Command")).not.toBeVisible();

      // Verify command appears in the commands list
      await expect(page.locator(`text=${originalName} - Test`)).toBeVisible();
   });

   test("should handle template selection with different command types", async ({
      page,
   }) => {
      // Open Add Command modal
      await page.click('button:has-text("Add Command")');
      await expect(page.locator("text=Add New Command")).toBeVisible();

      // Wait for templates
      await page.waitForSelector('[data-testid="command-template"]', {
         timeout: 5000,
      });

      // Test different template types if available
      const templates = page.locator('[data-testid="command-template"]');
      const templateCount = await templates.count();

      if (templateCount > 1) {
         // Click second template
         await templates.nth(1).click();

         // Verify form is populated
         const typeSelect = page.locator("#command-type");
         const selectedType = await typeSelect.inputValue();

         // Verify type is set (should be 'ssh', 'stream', or 'terminal')
         expect(["ssh", "stream", "terminal"]).toContain(selectedType);
      }
   });

   test("should reset form when modal is closed and reopened", async ({
      page,
   }) => {
      // Open Add Command modal
      await page.click('button:has-text("Add Command")');
      await expect(page.locator("text=Add New Command")).toBeVisible();

      // Select a template
      await page.waitForSelector('[data-testid="command-template"]', {
         timeout: 5000,
      });
      await page.locator('[data-testid="command-template"]').first().click();

      // Verify form is populated
      const nameInput = page.locator("#command-name");
      await expect(nameInput).not.toHaveValue("");

      // Close modal
      await page.click('button:has-text("Cancel")');
      await expect(page.locator("text=Add New Command")).not.toBeVisible();

      // Reopen modal
      await page.click('button:has-text("Add Command")');
      await expect(page.locator("text=Add New Command")).toBeVisible();

      // Verify form is reset
      await expect(nameInput).toHaveValue("");
   });
});
