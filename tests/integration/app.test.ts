/**
 * @file Jest puppeteer test for app.ts
 */

import * as FileSystem from "fs";
import * as Tree from "../../src/tree";
import * as TreeParser from "../../src/tree.parser";
import * as TreeScheme from "../../src/treescheme";
import * as TreeSchemeParser from "../../src/treescheme.parser";

describe("app", () => {
    beforeEach(async () => {
        await page.goto("http://localhost:3000");
    });

    it("should load", async () => {
        expect(await page.title()).toBe("TypedTree");
        await saveScreenshot("load");
    });

    it("can create new tree", async () => {
        await page.click("#newtree-button");
        await saveScreenshot("newtree");

        // Expect current tree to be first type of the root alias of the scheme
        const scheme = await getCurrentScheme();
        expect(await getCurrentTree()).toEqual(Tree.createNode(scheme.rootAlias.values[0]));
    });

    it("can load a scheme", async () => {
        const testScheme = `{
            "rootAlias": "Alias",
            "aliases": [ { "identifier": "Alias", "values": [ "Node" ] } ],
            "nodes": [ { "nodeType": "Node" } ]
        }`;

        // Set the test-file in the scheme input field.
        FileSystem.writeFileSync("tmp/test.treescheme.json", testScheme);
        const schemeInput = await page.$("#openscheme-file");
        if (schemeInput !== null) {
            schemeInput.uploadFile("tmp/test.treescheme.json");
            // Give the page some time to respond to the file input.
            await page.waitFor(500);
        }

        const testSchemeParseResult = TreeSchemeParser.parseJson(testScheme);
        if (testSchemeParseResult.kind === "error") {
            throw new Error(testSchemeParseResult.kind);
        }
        expect(await getCurrentScheme()).toEqual(testSchemeParseResult.value);
    });

    it("can toggle toolbox visibility", async () => {
        await page.click("#toolbox-toggle");
        expect(await getToolboxVisibility()).toEqual("hidden");
        await saveScreenshot("toolbox-hidden");

        await page.click("#toolbox-toggle");
        expect(await getToolboxVisibility()).toEqual("visible");
        await saveScreenshot("toolbox-visible");

        function getToolboxVisibility(): Promise<string | null> {
            return page.$eval("#toolbox", t => (t as HTMLElement).style.visibility);
        }
    });

    it("links to github", async () => {
        await page.click("#github-button");
        expect(page.url()).toBe("https://github.com/BastianBlokland/typedtree-editor");
    });
});

async function getCurrentScheme(): Promise<TreeScheme.IScheme> {
    const schemeJson: string | undefined = await page.evaluate("getCurrentSchemeJson()");
    if (schemeJson !== undefined) {
        const parseResult = TreeSchemeParser.parseJson(schemeJson);
        if (parseResult.kind === "success") {
            return parseResult.value;
        }
    }
    throw new Error("No valid scheme found");
}

async function getCurrentTree(): Promise<Tree.INode> {
    const treeJson: string | undefined = await page.evaluate("getCurrentTreeJson()");
    if (treeJson !== undefined) {
        const parseResult = TreeParser.parseJson(treeJson);
        if (parseResult.kind === "success") {
            return parseResult.value;
        }
    }
    throw new Error("No valid tree found");
}

async function saveScreenshot(title: string): Promise<void> {
    const screenshotDir = "./screenshots";
    await page.screenshot({ path: `${screenshotDir}/${title}.png` });
}
