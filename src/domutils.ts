import "file-saver";

export function saveJsonText(json: string, fileName: string): void {
    const blob = new Blob([json], { type: "application/json;charset=utf-8" });
    saveAs(blob, fileName);
}

export function subscribeToClick(elementId: string, callback: () => void): void {
    const element = document.getElementById(elementId);
    if (element == null)
        throw new Error(`Element with id: ${elementId} not found`);
    element.onclick = callback;
}

export function subscribeToFileInput(inputId: string, callback: (file: File) => void): void {
    const element = document.getElementById(inputId);
    if (element == null)
        throw new Error(`Element with id: ${inputId} not found`);
    const inputElement = <HTMLInputElement>element;
    element.onchange = _ => {
        if (inputElement.files != null && inputElement.files.length > 0)
            callback(inputElement.files[0]);
        inputElement.value = "";
    };
}

export function setText(elementId: string, text: string): void {
    const element = document.getElementById(elementId);
    if (element == null)
        throw new Error(`Element with id: ${elementId} not found`);
    element.textContent = text;
}
