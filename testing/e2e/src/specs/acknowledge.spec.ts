import { test, expect } from '@playwright/test';
import { AcknowledgePage } from '../page-objects/acknowledge.page';

test.describe('Acknowledge Page', () => {
  let ack: AcknowledgePage;

  test.beforeEach(async ({ page }) => {
    ack = new AcknowledgePage(page);
  });

  test('shows error when task_id and token are missing', async () => {
    await ack.gotoWithoutParams();

    await expect(ack.errorHeading).toBeVisible({ timeout: 10_000 });
    // Should show the error about missing params
    const errorText = ack.page.getByText(/missing task_id or token/i);
    await expect(errorText).toBeVisible();
  });

  test('shows error with invalid token', async () => {
    // Use a fake task ID and invalid token
    await ack.gotoWithParams('00000000-0000-0000-0000-000000000000', 'invalidtoken123');

    await expect(ack.errorHeading).toBeVisible({ timeout: 10_000 });
  });

  test('shows Tilli-go title', async () => {
    await ack.gotoWithoutParams();
    await expect(ack.title).toContainText('Tilli-go');
  });
});
