/**
 * @file Utilities for interacting with the browser dom.
 */

import * as Vec from "./vector";

// External node-plugins
import "file-saver";
// @ts-ignore (No types available)
import normalizeWheel from "normalize-wheel";

/** Html class identifier */
export type ClassName = string;

/**
 * Save a json text file on the users machine.
 * @param json Json to save to the users machine.
 * @param fileName Name of the file to save.
 */
export function saveJsonText(json: string, fileName: string): void {
    const blob = new Blob([json], { type: "application/json;charset=utf-8" });
    saveAs(blob, fileName);
}

/**
 * Read string from clipboard. User is prompted for permission first, throws if permission was not provided.
 * Note: Not supported on all browsers.
 * @returns Promise that contains the string that was read.
 */
export function readClipboardText(): Promise<string> {
    const clipboard = (navigator as any).clipboard;
    if (clipboard === undefined) {
        throw new Error("Clipboard api not supported");
    }
    return clipboard.readText();
}

/**
 * Write string to clipboard. User is prompted for permission first, throws if permission was not provided.
 * Note: Not supported on all browsers.
 * @param data Data to write to the clipboard.
 * @returns Promise that completes when the data is written.
 */
export function writeClipboardText(data: string): Promise<void> {
    const clipboard = (navigator as any).clipboard;
    if (clipboard === undefined) {
        throw new Error("Clipboard api not supported");
    }
    return clipboard.writeText(data);
}

/**
 * Get the mouse-wheel delta normalized across browsers. Tries to estimate how far was scrolled
 * relative to the wheel (1 = a single spin of the wheel) This allows for consistent scroll speeds
 * across different browsers.
 * @param event Wheel-event to normalize.
 * @returns Normalized vector representing the wheel movements in spins.
 */
export function getMouseWheelDelta(event: WheelEvent): Vec.IVector2 {
    /* Implemented using: https://github.com/basilfx/normalize-wheel/
    which in turn is based on code used by Facebook to attempt to normalize the mouse-scroll speeds
    across browsers. */
    const norm = normalizeWheel(event);
    return Vec.createVector(norm.spinX, norm.spinY);
}

/**
 * Check if the user currently has an input element focussed.
 * @returns True if the user current has an input element focussed, otherwise False.
 */
export function isInputFocussed(): boolean {
    if (document.activeElement === null) {
        return false;
    }
    return document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "SELECT";
}

/**
 * Create an ordered-list with given elements.
 * @param items Items to add to the list.
 * @returns Newly created olist element.
 */
export function createOList(
    ...items: HTMLElement[]): HTMLOListElement {

    return createWithChildren("ol", ...items.map(i => createWithChildren("li", i)));
}

/**
 * Create an unordered-list with given elements.
 * @param items Items to add to the list.
 * @returns Newly created ulist element.
 */
export function createUList(
    ...items: HTMLElement[]): HTMLUListElement {

    return createWithChildren("ul", ...items.map(i => createWithChildren("li", i)));
}

/**
 * Create a new html element and append the given elements as children.
 * @param tagName Tag of the element to create.
 * @param children Children to append to the new element.
 * @returns Newly created html-element.
 */
export function createWithChildren<K extends keyof HTMLElementTagNameMap>(
    tagName: K,
    ...children: HTMLElement[]): HTMLElementTagNameMap[K] {

    const elem: HTMLElementTagNameMap[K] = document.createElement(tagName);
    children.forEach(c => elem.appendChild(c));
    return elem;
}

/**
 * Create a new html element with the given text content.
 * @param tagName Tag of the element to create.
 * @param textContent Text to add to the element.
 * @param className Optional classname to give to the element.
 * @returns Newly created html-element.
 */
export function createWithText<K extends keyof HTMLElementTagNameMap>(
    tagName: K,
    textContent: string,
    className?: ClassName): HTMLElementTagNameMap[K] {

    const elem: HTMLElementTagNameMap[K] = document.createElement(tagName);
    if (className !== undefined) {
        elem.className = className;
    }
    elem.textContent = textContent;
    return elem;
}

/**
 * Create a new summary html element with the given text content.
 * Note: There is no typed 'SummaryHTMLElement' so thats why we need this untyped one.
 * @param textContent Text to add to the summary.
 * @param className Optional classname to give to the element.
 * @returns Newly created html-element.
 */
export function createSummary(textContent: string, className?: ClassName): HTMLElement {
    const elem = document.createElement("summary");
    elem.textContent = textContent;
    if (className !== undefined) {
        elem.className = className;
    }
    return elem;
}

/**
 * Subscribe to dom click.
 * Will throw if the element doesn't exist.
 * @param elementId Id of the element to subscribe to.
 * @param callback Callback to invoke when the element is clicked.
 */
export function subscribeToClick(elementId: string, callback: () => void): void {
    const element = document.getElementById(elementId);
    if (element === null) {
        throw new Error(`Element with id: ${elementId} not found`);
    }
    element.onclick = callback;
}

/**
 * Subscribe to the input from a file-input file being changed.
 * Will throw if the element doesn't exist.
 * @param inputId Id of the element to subscribe to.
 * @param callback Callback to invoke when the file-input changes.
 */
export function subscribeToFileInput(inputId: string, callback: (file: File) => void): void {
    const element = document.getElementById(inputId);
    if (element === null) {
        throw new Error(`Element with id: ${inputId} not found`);
    }
    const inputElement = element as HTMLInputElement;
    element.onchange = _ => {
        if (inputElement.files !== null && inputElement.files.length > 0) {
            callback(inputElement.files[0]);
        }
        inputElement.value = "";
    };
}

/**
 * Set the disabled property of a button;
 * @param elementId Id of the button to set the disabled property for.
 * @param disabled True if the button should be disabled False is the button should be enabled.
 */
export function setButtonDisabled(elementId: string, disabled: boolean): void {
    const element = document.getElementById(elementId);
    if (element === null || element.nodeName !== "BUTTON") {
        throw new Error(`Element with id: ${elementId} not found or is not a button`);
    }
    (element as HTMLButtonElement).disabled = disabled;
}

/**
 * Delete all the children of a given node.
 * @param element Element to delete the children from.
 */
export function clearChildren(element: Element): void {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

/**
 * Set the text content of an element.
 * * Will throw if the element doesn't exist.
 * @param elementId Id of the element to set the text for.
 * @param text Text to assign to the element.
 */
export function setText(elementId: string, text: string): void {
    const element = document.getElementById(elementId);
    if (element === null) {
        throw new Error(`Element with id: ${elementId} not found`);
    }
    element.textContent = text;
}

/**
 * Create a new input element of type text. Note: This does not get parented anywhere yet.
 * @param text Initial text to show in the input.
 * @param callback Callback that will get fired when the user changes the input.
 * @returns Newly created input element.
 */
export function createTextInput(
    text: string,
    callback: (newText: string) => void): HTMLInputElement {

    const element = document.createElement("input");
    element.setAttribute("type", "text");
    element.value = text;
    element.onchange = event => {
        callback(element.value);
    };
    return element;
}

/**
 * Create a new input element of type number. Note: This does not get parented anywhere yet.
 * @param num Initial number to show in the input.
 * @param callback Callback that will get fired when the user changes the input.
 * @returns Newly created input element.
 */
export function createNumberInput(
    num: number,
    callback: (newNumber: number) => void): HTMLInputElement {

    const element = document.createElement("input");
    element.setAttribute("type", "number");
    element.setAttribute("step", "any");
    element.value = num.toString();
    element.onchange = event => {
        callback(Number(element.value));
    };
    return element;
}

/**
 * Create a new input element of type checkbox. Note: This does not get parented anywhere yet.
 * @param bool If the checkbox should be initially checked or not.
 * @param callback Callback that will get fired when the user changes the input.
 * @returns Newly created input element.
 */
export function createBooleanInput(
    bool: boolean,
    callback: (newBoolean: boolean) => void): HTMLInputElement {

    const element = document.createElement("input");
    element.setAttribute("type", "checkbox");
    element.checked = bool;
    element.onchange = _ => {
        callback(element.checked);
    };
    return element;
}

/**
 * Create a new select element. Note: This does not get parented anywhere yet.
 * @param currentIndex Current active index.
 * @param options Possible options for the select.
 * @param callback Callback that will get fired when the user selects a different item.
 * @returns Newly created select element.
 */
export function createSelectInput(
    currentIndex: number,
    options: ReadonlyArray<string>,
    callback: (newIndex: number) => void): HTMLSelectElement {

    if (currentIndex < 0 || currentIndex >= options.length) {
        throw new Error(
            `Index ${currentIndex} is out of bounds of the options. (options length: ${options.length})`);
    }
    const element = createWithChildren("select", ...options.map(o => createWithText("option", o)));
    element.selectedIndex = currentIndex;
    element.onchange = _ => {
        callback(element.selectedIndex);
    };
    return element;
}
