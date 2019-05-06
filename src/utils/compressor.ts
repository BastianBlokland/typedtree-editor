/**
 * @file Utilities for compressing text.
 */

import * as LZString from "lz-string";

/**
 * Compresses given text into uri-safe ascii text.
 * @param uncompressed Text to compress.
 * @returns Compressed uri-safe ascii text.
 */
export function compressToUriComponent(uncompressed: string): string {
    return LZString.compressToEncodedURIComponent(uncompressed);
}

/**
 * Decompress text that was previously compressed using 'compressToUriComponent'.
 * @param compressed Text that was compressed using 'compressToUriComponent'.
 * @returns Original uncompressed text.
 */
export function decompressFromUriComponent(compressed: string): string {
    return LZString.decompressFromEncodedURIComponent(compressed);
}
