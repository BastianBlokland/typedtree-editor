/**
 * @file Jest tests for utils/compressor.ts
 */

import * as Utils from "../../../src/utils";

test("compressToUriComponentProducesUriSaveText", () => {
    const compressed = Utils.Compressor.compressToUriComponent("This is a test string");
    expect(compressed).toEqual(encodeURIComponent(compressed));
});

test("compressToUriComponentCanBeDecompressed", () => {
    const input = "This is a test string";
    const compressed = Utils.Compressor.compressToUriComponent(input);
    const decompressed = Utils.Compressor.decompressFromUriComponent(compressed);
    expect(decompressed).toEqual(input);
});
