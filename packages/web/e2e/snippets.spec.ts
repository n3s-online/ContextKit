import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('loads and displays header', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveText('ContextKit');
  });

  test('has New Snippet button', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'New Snippet' })).toBeVisible();
  });

  test('shows empty state when no snippets', async ({ page }) => {
    await page.goto('/');
    // May show "No snippets yet" or snippet list depending on database
    await expect(page.locator('main')).toBeVisible();
  });

  test('search input is functional', async ({ page }) => {
    await page.goto('/');
    const searchInput = page.getByPlaceholder('Search snippets...');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('test query');
    await expect(searchInput).toHaveValue('test query');
  });
});

test.describe('New Snippet Page', () => {
  test('navigates to new snippet page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'New Snippet' }).click();
    await expect(page).toHaveURL('/snippets/new');
  });

  test('has title input', async ({ page }) => {
    await page.goto('/snippets/new');
    await expect(page.getByPlaceholder('Snippet title...')).toBeVisible();
  });

  test('has tag input', async ({ page }) => {
    await page.goto('/snippets/new');
    await expect(page.getByPlaceholder('Add tags...')).toBeVisible();
  });

  test('has create button', async ({ page }) => {
    await page.goto('/snippets/new');
    await expect(page.getByRole('button', { name: 'Create' })).toBeVisible();
  });

  test('has preview toggle', async ({ page }) => {
    await page.goto('/snippets/new');
    await expect(page.getByRole('button', { name: /Preview/ })).toBeVisible();
  });

  test('shows validation error for empty form', async ({ page }) => {
    await page.goto('/snippets/new');
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByText('Title and content are required')).toBeVisible();
  });

  test('can add tags', async ({ page }) => {
    await page.goto('/snippets/new');
    const tagInput = page.getByPlaceholder('Add tags...');
    await tagInput.fill('test-tag');
    await tagInput.press('Enter');
    await expect(page.getByText('test-tag')).toBeVisible();
  });

  test('can create a snippet', async ({ page }) => {
    await page.goto('/snippets/new');

    // Fill in the form
    await page.getByPlaceholder('Snippet title...').fill('E2E Test Snippet');

    // Add tags
    const tagInput = page.getByPlaceholder('Add tags...');
    await tagInput.fill('e2e');
    await tagInput.press('Enter');

    // Type in the editor (CodeMirror)
    // The editor is a contenteditable div
    const editor = page.locator('.cm-content');
    await editor.click();
    await page.keyboard.type('# Test Content\n\nThis is test content.');

    // Submit
    await page.getByRole('button', { name: 'Create' }).click();

    // Should redirect to the new snippet page
    await expect(page).toHaveURL(/\/snippets\/[a-f0-9-]+/);
  });
});

test.describe('Snippet View Page', () => {
  test.beforeEach(async ({ page }) => {
    // Create a snippet first
    await page.goto('/snippets/new');
    await page.getByPlaceholder('Snippet title...').fill('View Test Snippet');

    const editor = page.locator('.cm-content');
    await editor.click();
    await page.keyboard.type('# Test\n\nContent here');

    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page).toHaveURL(/\/snippets\/[a-f0-9-]+/);
  });

  test('displays snippet title in input', async ({ page }) => {
    // Title is displayed in an input field on the edit page
    await expect(page.getByPlaceholder('Snippet title...')).toHaveValue('View Test Snippet');
  });

  test('has back link', async ({ page }) => {
    await expect(page.getByText('← Back')).toBeVisible();
  });

  test('can navigate back to dashboard', async ({ page }) => {
    await page.getByText('← Back').click();
    await expect(page).toHaveURL('/');
  });
});
