import "file-saver";

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
 * Subscribe to dom click.
 * Will throw if the element doesn't exist.
 * @param elementId Id of the element to subscribe to.
 * @param callback Callback to invoke when the element is clicked.
 */
export function subscribeToClick(elementId: string, callback: () => void): void {
    const element = document.getElementById(elementId);
    if (element === null)
        throw new Error(`Element with id: ${elementId} not found`);
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
    if (element === null)
        throw new Error(`Element with id: ${inputId} not found`);
    const inputElement = <HTMLInputElement>element;
    element.onchange = _ => {
        if (inputElement.files != null && inputElement.files.length > 0)
            callback(inputElement.files[0]);
        inputElement.value = "";
    };
}

/**
 * Set the text content of an element.
 * * Will throw if the element doesn't exist.
 * @param elementId Id of the element to set the text for.
 * @param text Text to assign to the element.
 */
export function setText(elementId: string, text: string): void {
    const element = document.getElementById(elementId);
    if (element === null)
        throw new Error(`Element with id: ${elementId} not found`);
    element.textContent = text;
}

/**
 * Create a new input element of type text. Note: This does not get parented anywhere yet.
 * @param className ClassName of the html element.
 * @param text Initial text to show in the input.
 * @param callback Callback that will get fired when the user changes the input.
 * @returns Newly created input element.
 */
export function createTextInput(
    className: ClassName,
    text: string,
    callback: (newText: string) => void): HTMLInputElement {

    const element = document.createElement("input");
    element.setAttribute("type", "text");
    element.className = className;
    element.value = text;
    element.onchange = event => {
        callback(element.value);
    };
    return element;
}

/**
 * Create a new input element of type number. Note: This does not get parented anywhere yet.
 * @param className ClassName of the html element.
 * @param number Initial number to show in the input.
 * @param callback Callback that will get fired when the user changes the input.
 * @returns Newly created input element.
 */
export function createNumberInput(
    className: ClassName,
    number: number,
    callback: (newNumber: number) => void): HTMLInputElement {

    const element = document.createElement("input");
    element.setAttribute("type", "number");
    element.className = className;
    element.value = number.toString();
    element.onchange = event => {
        callback(Number(element.value));
    };
    return element;
}
