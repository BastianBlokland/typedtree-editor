/**
 * @file Jest puppeteer test for app.ts
 */

import * as FileSystem from "fs";
import * as Tree from "../../src/tree";
import * as TreePack from "../../src/treepack";
import * as TreeScheme from "../../src/treescheme";

const url = "http://127.0.0.1:3000";

describe("app", () => {
    page.on("dialog", async dialog => {
        await dialog.accept();
    });

    beforeEach(async () => {
        await loadPage(url);
    });

    afterEach(async () => {
        await clearStorage();
    });

    it("should load", async () => {
        expect(await page.title()).toBe("TypedTree");
        await saveScreenshot("load");
    });

    it("can create new tree", async () => {
        await page.click("#newtree-button");
        await saveScreenshot("newtree");

        // Expect current tree to be first type of the root alias of the scheme.
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
        await page.waitFor(100); // Give the page some time to respond.

        const testSchemeParseResult = TreeScheme.Parser.parseJson(testScheme);
        if (testSchemeParseResult.kind === "error") {
            throw new Error(testSchemeParseResult.errorMessage);
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
        await page.waitFor(100); // Give the page some time to respond.

        await saveScreenshot("loaded-tree");
        expect(await getCurrentTree()).toEqual(Tree.createNode(scheme.rootAlias.values[0]));
    });

    it("can load a treepack", async () => {
        const testPack = `{
            "scheme": {
                "rootAlias": "Alias",
                "aliases": [ { "identifier": "Alias", "values": [ "Node" ] } ],
                "nodes": [ { "nodeType": "Node" } ]
            },
            "tree": {
                "$type": "Node"
            }
        }`;

        // Set the test-file in the pack input field.
        FileSystem.writeFileSync("tmp/test.treepack.json", testPack);
        (await page.$("#openpack-file"))!.uploadFile("tmp/test.treepack.json");
        await page.waitFor(100); // Give the page some time to respond.

        const testPackParseResult = TreePack.Parser.parseJson(testPack);
        if (testPackParseResult.kind === "error") {
            throw new Error(testPackParseResult.errorMessage);
        }
        await saveScreenshot("loaded-pack");
        expect(await getCurrentPack()).toEqual(testPackParseResult.value);
    });

    it("can change type of a node", async () => {
        const scheme = await getCurrentScheme();
        const targetType = scheme.rootAlias.values[scheme.rootAlias.values.length - 1];
        expect((await getCurrentTree()).type).not.toBe(targetType);
        await saveScreenshot("change-node-before");

        await page.select(".node-type", targetType);
        await page.waitFor(100); // Give the page some time to respond.

        await saveScreenshot("change-node-after");
        expect((await getCurrentTree()).type).toBe(targetType);
    });

    it("can undo changes", async () => {
        const startingTree = await getCurrentTree();
        await page.click("#newtree-button");
        expect(await getCurrentTree()).not.toEqual(startingTree);

        await page.click("#undo-button");
        expect(await getCurrentTree()).toEqual(startingTree);
    });

    it("can redo changes", async () => {
        await page.click("#newtree-button");
        const newTree = await getCurrentTree();

        await page.click("#undo-button");
        expect(await getCurrentTree()).not.toEqual(newTree);

        await page.click("#redo-button");
        expect(await getCurrentTree()).toEqual(newTree);
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

    it("can share", async () => {
        // Create a new tree.
        await page.click("#newtree-button");
        const expectedTree = await getCurrentTree();

        // Get the share url.
        const shareUrl = await getShareUrl();
        // Verify that the share url is in the correct format.
        expect(shareUrl).toMatch(new RegExp(
            `^${url.replace("/", "\/")}\\/index\\.html\\?scheme=.*&tree=.*&treename=new.tree.json$`));

        // Refresh the page.
        await clearStorage();
        await loadPage(url);
        expect(await getCurrentTree()).not.toEqual(expectedTree);

        // Open share url.
        await loadPage(shareUrl);
        expect(await getCurrentTree()).toEqual(expectedTree);
    });

    it("links to github", async () => {
        await page.click("#github-button");
        await page.waitFor(100); // Give the page some time to respond.
        expect(page.url()).toBe("https://github.com/BastianBlokland/typedtree-editor");
    });
});

async function loadPage(url: string): Promise<void> {
    await page.goto(url);
    await page.waitFor(100); // Give the page some time to load.
}

async function clearStorage(): Promise<void> {
    await page.evaluate(() => localStorage.clear());
}

async function getCurrentScheme(): Promise<TreeScheme.IScheme> {
    const schemeJson: string | undefined = await page.evaluate("getCurrentSchemeJson()");
    if (schemeJson !== undefined) {
        const parseResult = TreeScheme.Parser.parseJson(schemeJson);
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

async function getCurrentPack(): Promise<TreePack.ITreePack> {
    const packJson: string | undefined = await page.evaluate("getCurrentPackJson()");
    if (packJson !== undefined) {
        const parseResult = TreePack.Parser.parseJson(packJson);
        if (parseResult.kind === "success") {
            return parseResult.value;
        }
    }
    throw new Error("No valid pack found");
}

async function getShareUrl(): Promise<string> {
    return await page.evaluate("getShareUrl()");
}

async function saveScreenshot(title: string): Promise<void> {
    const screenshotDir = "./screenshots";
    await page.screenshot({ path: `${screenshotDir}/${title}.png` });
}
