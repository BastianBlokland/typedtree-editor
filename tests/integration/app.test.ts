/**
 * @file Jest puppeteer test for app.ts
 */

import * as FileSystem from "fs";
import * as Tree from "../../src/tree";
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
        (await page.$("#openscheme-file"))!.uploadFile("tmp/test.treescheme.json");
        await page.waitFor(100); // Give the page some time to respond

        const testSchemeParseResult = TreeSchemeParser.parseJson(testScheme);
        if (testSchemeParseResult.kind === "error") {
            throw new Error(testSchemeParseResult.kind);
        }
        await saveScreenshot("loaded-scheme");
        expect(await getCurrentScheme()).toEqual(testSchemeParseResult.value);
    });

    it("can load a tree", async () => {
        const scheme = await getCurrentScheme();
        const testTree = `{ "$type": "${scheme.rootAlias.values[0]}" }`;

        // Set the test-file in the scheme input field.
        FileSystem.writeFileSync("tmp/test.tree.json", testTree);
        (await page.$("#opentree-file"))!.uploadFile("tmp/test.tree.json");
        await page.waitFor(100); // Give the page some time to respond

        await saveScreenshot("loaded-tree");
        expect(await getCurrentTree()).toEqual(Tree.createNode(scheme.rootAlias.values[0]));
    });

    it("can change type of a node", async () => {
        const scheme = await getCurrentScheme();
        const targetType = scheme.rootAlias.values[scheme.rootAlias.values.length - 1];
        expect((await getCurrentTree()).type).not.toBe(targetType);
        await saveScreenshot("change-node-before");

        await page.select(".node-type", targetType);
        await page.waitFor(100); // Give the page some time to respond

        await saveScreenshot("change-node-after");
        expect((await getCurrentTree()).type).toBe(targetType);
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
        const parseResult = Tree.Parser.parseJson(treeJson);
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
