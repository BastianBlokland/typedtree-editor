/**
 * @file Jest puppeteer test for app.ts
 */

describe("app", () => {
    beforeEach(async () => {
        await page.goto("http://localhost:3000");
    });

    it("should load", async () => {
        await expect(await page.title()).toMatch("TypedTree");
        await saveScreenshot("load");
    });
});

async function saveScreenshot(title: string): Promise<void> {
    const screenshotDir = "./screenshots";
    await page.screenshot({ path: `${screenshotDir}/${title}.png` });
}
