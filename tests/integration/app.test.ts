/**
 * @file Jest puppeteer test for app.ts
 */

describe("app", () => {
    beforeEach(async () => {
        await page.goto("http://localhost:3000");
    });

    it("should load", async () => {
        await expect(await page.title()).toMatch("TypedTree");
    });
});
