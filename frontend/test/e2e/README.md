# E2E Tests for Command CRUD Functionality

This directory contains comprehensive Playwright end-to-end tests for the VM Orchestrator command management features.

## 🧪 Test Files Overview

### 1. `command-smoke.spec.js` - Quick Smoke Tests (5 minutes)
**Purpose**: Essential functionality verification for rapid testing
- ✅ Open Add Command modal → templates visible
- ✅ Click template → form populates (no execution)
- ✅ Create command → appears in list
- ✅ Edit command → changes save
- ✅ Delete command → disappears from list
- 🚀 Full CRUD workflow in one test
- 🔧 Basic error handling
- 📱 Basic responsive check

### 2. `add-command-form.spec.js` - Template Selection Fix
**Purpose**: Tests the fix for AddCommandForm template selection issue
- Template modal opening and display
- Template selection populating form fields
- Preventing command execution on template click
- Successful command creation after template selection
- Form reset behavior

### 3. `command-crud.spec.js` - CRUD Operations
**Purpose**: Comprehensive testing of Create, Read, Update, Delete operations
- **CREATE**: Command creation with validation
- **READ**: Command list display and details
- **UPDATE**: Edit modal, form validation, successful updates
- **DELETE**: Confirmation modal, cancellation, successful deletion

### 4. `command-error-handling.spec.js` - Error Scenarios
**Purpose**: Network errors, validation errors, and edge cases
- API failure handling (create, update, delete)
- Loading states during slow responses
- Validation error messages
- Special characters and complex commands
- Rapid successive operations

### 5. `command-ui-ux.spec.js` - UI/UX Verification
**Purpose**: User interface and experience testing
- Loading states with spinners and disabled buttons
- Modal behavior (close methods, focus management)
- Responsive design (mobile, tablet, desktop)
- Accessibility (ARIA labels, keyboard navigation)
- Visual feedback (hover states, error styling)

### 6. `command-persistence.spec.js` - Data Persistence
**Purpose**: Data consistency and persistence testing
- Command persistence after page refresh
- VM switching behavior
- Multi-tab consistency
- Concurrent operations handling

## 🚀 Running the Tests

### Prerequisites
1. Ensure the frontend development server is running:
   ```bash
   npm run dev
   ```

2. Ensure the backend API is running and accessible

### Test Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run only smoke tests (quick verification)
npm run test:e2e:smoke

# Run tests with UI mode (visual test runner)
npm run test:e2e:ui

# Run tests in debug mode
npm run test:e2e:debug

# Run specific test file
npx playwright test add-command-form.spec.js

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run tests on specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## 📋 Test Data Requirements

### VM Setup
Tests expect at least one VM to be available in the system. For comprehensive testing:
- At least 1 VM for basic CRUD operations
- At least 2 VMs for VM switching tests

### API Endpoints
Tests verify the following API endpoints work correctly:
- `GET /api/vms/{vmId}/commands` - List commands
- `POST /api/vms/{vmId}/commands` - Create command
- `PUT /api/commands/{id}` - Update command
- `DELETE /api/commands/{id}` - Delete command
- `GET /api/commands` - Get command templates

## 🎯 Test Selectors

The tests use data-testid attributes for reliable element selection:

```html
<!-- Required selectors in your components -->
<div data-testid="vm-selector">...</div>
<div data-testid="command-template">...</div>
<div data-testid="command-card">...</div>
<button data-testid="edit-command">...</button>
<button data-testid="delete-command">...</button>
```

## 🐛 Troubleshooting

### Common Issues

1. **Tests fail with "VM selector not found"**
   - Ensure VMs are loaded in the application
   - Check if VM selector has the correct data-testid

2. **Template tests fail**
   - Verify command templates are available via `/api/commands`
   - Check if templates have the correct data-testid

3. **API tests fail**
   - Ensure backend is running and accessible
   - Check network tab for API errors
   - Verify API endpoints match the specification

4. **Modal tests fail**
   - Check if modals have proper ARIA roles
   - Verify modal close buttons are accessible

### Debug Tips

1. **Use headed mode** to see what's happening:
   ```bash
   npx playwright test --headed --slowMo=1000
   ```

2. **Use debug mode** to step through tests:
   ```bash
   npm run test:e2e:debug
   ```

3. **Check screenshots** in `test-results/` folder after failures

4. **Use trace viewer** for detailed debugging:
   ```bash
   npx playwright show-trace test-results/trace.zip
   ```

## 📊 Test Reports

After running tests, view the HTML report:
```bash
npx playwright show-report
```

## 🔄 CI/CD Integration

For continuous integration, add to your workflow:

```yaml
- name: Install Playwright
  run: npx playwright install

- name: Run E2E tests
  run: npm run test:e2e

- name: Upload test results
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: playwright-report
    path: playwright-report/
```

## 📝 Writing New Tests

When adding new command-related features:

1. Add smoke tests to `command-smoke.spec.js`
2. Add detailed tests to the appropriate category file
3. Use descriptive test names with emojis for quick identification
4. Follow the existing patterns for selectors and assertions
5. Add proper error handling and edge case testing

## 🎯 Test Coverage

These tests cover:
- ✅ All CRUD operations
- ✅ Error handling and validation
- ✅ UI/UX interactions
- ✅ Data persistence
- ✅ Responsive design
- ✅ Accessibility basics
- ✅ API integration
- ✅ Modal behavior
- ✅ Loading states

## 🚨 Known Limitations

1. Tests assume at least one VM is available
2. Some tests require multiple VMs for complete coverage
3. Template tests depend on backend providing command templates
4. Network error simulation may not work in all environments
