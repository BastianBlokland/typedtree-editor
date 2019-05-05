/**
 * @file Responsible for creating svg display elements and updating them.
 */

import * as Utils from "../utils";
import { Vector } from "../utils";

/** Builder that display elements can be added to. */
export interface IBuilder {
    /**
     * Add a new root display element.
     * @param className Html class identifier for this element.
     * @param  position Position to place the element at.
     * @returns Newly created element.
     */
    addElement(className: Utils.Dom.ClassName, position: Vector.Position): IElement;
}

/** Display element that content can be added to. */
export interface IElement {
    /** Html class identifier for this element */
    readonly className: string;

    /**
     * Position of this element.
     * Note: This does NOT need to match screen pixels as the canvas can be zoomed.
     */
    readonly position: Vector.Position;

    /** Add a child element */
    addElement(className: Utils.Dom.ClassName, position: Vector.Position): IElement;

    /** Add a rectangle graphic to this element. */
    addRect(className: Utils.Dom.ClassName, size: Vector.Size, position: Vector.Position): void;

    /**
     * Add a text graphic to this element.
     * Note: Position is vertically centered.
     */
    addText(
        className: Utils.Dom.ClassName,
        value: string,
        position: Vector.Position,
        size: Vector.Size): void;

    /**
     * Add a editable text graphic to this element.
     * Note: Position is vertically centered.
     */
    addEditableText(
        className: Utils.Dom.ClassName,
        value: string,
        position: Vector.Position,
        size: Vector.Size,
        callback: (newValue: string) => void): void;

    /**
     * Add a editable number graphic to this element.
     * Note: Position is vertically centered.
     */
    addEditableNumber(
        className: Utils.Dom.ClassName,
        value: number,
        position: Vector.Position,
        size: Vector.Size,
        callback: (newValue: number) => void): void;

    /**
     * Add a editable boolean graphic to this element.
     * Note: Position is vertically centered.
     */
    addEditableBoolean(
        className: Utils.Dom.ClassName,
        value: boolean,
        position: Vector.Position,
        size: Vector.Size,
        callback: (newValue: boolean) => void): void;

    /**
     * Add a editable dropdown graphic to this element.
     * Note: Position is vertically centered.
     */
    addDropdown(
        className: Utils.Dom.ClassName,
        currentIndex: number,
        options: ReadonlyArray<string>,
        position: Vector.Position,
        size: Vector.Size,
        callback: (newIndex: number) => void): void;

    /** Add a bezier graphic to this element. */
    addBezier(
        className: Utils.Dom.ClassName,
        from: Vector.Position,
        c1: Vector.Position,
        c2: Vector.Position,
        to: Vector.Position): void;

    /** Add a external graphic to this element. */
    addGraphics(
        className: Utils.Dom.ClassName,
        graphicsId: string,
        position: Vector.Position,
        clickCallback?: (() => void)): void;
}

/** Initialize the display, needs to be done once. */
export function initialize(): void {
    if (svgRoot != null) {
        throw new Error("Already initialized");
    }

    const displayRoot = document.getElementById(displayRootElementId);
    if (displayRoot === null) {
        throw new Error(`No dom element found with id: ${displayRootElementId}`);
    }

    // Create document
    svgDocument = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgDocument.setAttribute("width", "100%");
    svgDocument.setAttribute("height", "100%");
    displayRoot.appendChild(svgDocument);

    // Create a root-element for applying root transformations to.
    svgRoot = document.createElementNS("http://www.w3.org/2000/svg", "g");
    svgDocument.appendChild(svgRoot);

    // Setup global listeners
    const inputBlocker = document.getElementById(inputBlockerDomElementId);
    // Prevent standard 'dragging'
    displayRoot.addEventListener("dragstart", event => event.preventDefault(), { passive: false });
    // Disable selecting of elements when 'dragging'
    (document as any).onselectstart = (event: any) => {
        if (dragging) {
            event.preventDefault();
        }
    };

    // Subscribe to both desktop and mobile 'down' events
    displayRoot.addEventListener("mousedown", event => {
        handleMoveStart({ x: event.clientX, y: event.clientY });
    }, { passive: true });
    displayRoot.addEventListener("touchstart", event => {
        handleMoveStart({ x: event.touches[0].clientX, y: event.touches[0].clientY });
    }, { passive: true });

    // Subscribe to both desktop and mobile 'move' events
    window.addEventListener("mousemove", event => {
        if (dragging) {
            event.preventDefault();
        }
        handleMoveUpdate({ x: event.clientX, y: event.clientY });
    }, { passive: false });
    window.addEventListener("touchmove", event => {
        if (dragging) {
            event.preventDefault();
        }
        handleMoveUpdate({ x: event.touches[0].clientX, y: event.touches[0].clientY });
    }, { passive: false });

    // Subscribe to both desktop and mobile 'up' events
    window.addEventListener("mouseup", _ => handleMoveEnd(), { passive: true });
    window.addEventListener("touchend", _ => handleMoveEnd(), { passive: true });

    // Subscribe to the desktop 'scrollwheel' event.
    displayRoot.addEventListener("wheel", event => {
        const scrollMultiplier = Utils.lerp(minZoomMultiplier, maxZoomMultiplier, zoomSpeed);
        const scrollDelta = Utils.Dom.getMouseWheelDelta(event).y * -scrollMultiplier;
        const pointerPos: Vector.Position = { x: (event as WheelEvent).pageX, y: (event as WheelEvent).pageY };
        handleScroll(scrollDelta, pointerPos);
    }, { passive: true });

    function handleMoveStart(pointerPos: Vector.Position): void {
        if (Utils.Dom.isInputFocussed()) {
            return;
        }
        dragOffset = Vector.subtract(viewOffset, pointerPos);
        dragging = true;
    }

    function handleMoveUpdate(pointerPos: Vector.Position): void {
        if (Utils.Dom.isInputFocussed()) {
            dragging = false;
            return;
        }
        if (dragging) {
            if (inputBlocker !== null) {
                inputBlocker.className = "order-front";
            }
            setOffset(Vector.add(dragOffset, pointerPos));
        }
    }

    function handleMoveEnd(): void {
        dragging = false;
        if (inputBlocker !== null) {
            inputBlocker.className = "order-back";
        }
    }

    function handleScroll(scrollDelta: number, pointerPos: Vector.Position): void {
        if (Utils.Dom.isInputFocussed()) {
            return;
        }
        zoom(scrollDelta, pointerPos);
    }
}

/**
 * The the content to display (overrides the previous content)
 * @param callback Callback that can be used to build the content.
 */
export function setContent(callback?: (builder: IBuilder) => void): void {
    assertInitialized();
    dragging = false;

    // Build new content
    const builder = new Builder();
    if (callback !== undefined) {
        callback(builder);
    }

    // Replace existing content
    const newContent = builder.build();
    Utils.Dom.clearChildren(svgRoot!);
    svgRoot!.appendChild(newContent);
}

/**
 * Provide a root offset of the content. (Will be used for centering)
 * @param offset Offset to use for centering content
 */
export function setContentOffset(offset: Vector.Position): void {
    contentOffset = offset;
}

/** Focus on the current content (Will be centered and scaled to fit). */
export function focusContent(maxScale?: number): void {
    assertInitialized();
    const displaySize = Vector.subtract(getDisplaySize(), displayMargin);
    const contentSize = getContentSize();

    // Calculate new scale
    let targetScale = Math.min(displaySize.x / contentSize.x, displaySize.y / contentSize.y);
    if (maxScale !== undefined) {
        targetScale = Math.min(targetScale, maxScale);
    }
    setScale(targetScale);

    // Calculate offset to center the content
    const scaledContentSize = Vector.multiply(contentSize, scale);
    const scaledContentOffset = Vector.multiply(contentOffset, scale);
    const centeringOffset = Vector.add(
        Vector.half(Vector.subtract(displaySize, scaledContentSize)),
        Vector.invert(scaledContentOffset));
    setOffset(Vector.add(halfDisplayMargin, centeringOffset));
}

/**
 * Update the zoom, use positive delta for zooming-in and negative delta for zooming-out.
 * @param delta Number indicating how far to zoom. (Use negative numbers for zooming out)
 * @param focalPoint Point to focus on when zooming. (defaults to page center)
 */
export function zoom(delta: number = 0.1, focalPoint?: Vector.Position): void {
    if (focalPoint === undefined) {
        // Default the focalPoint to the page center
        focalPoint = Vector.half(Vector.createVector(window.innerWidth, window.innerHeight));
    }

    // Calculate new-scale and offset to zoom-in to where the user was pointing
    const newScale = clampScale(scale + delta);
    const zoomFactor = (newScale - scale) / scale;
    const offsetToPointer = Vector.subtract(focalPoint, viewOffset);
    const offsetDelta = Vector.multiply(offsetToPointer, -zoomFactor);

    // Apply new scale and offset
    viewOffset = Vector.add(viewOffset, offsetDelta);
    scale = newScale;
    updateRootTransform();
}

/** Zoom speed, 0 = minimum speed, 1 = maximum speed. */
export let zoomSpeed = 0.5;

const displayRootElementId = "svg-display";
const inputBlockerDomElementId = "input-blocker";
const minScale = 0.05;
const maxScale = 3;
const minZoomMultiplier = 0.01;
const maxZoomMultiplier = 0.25;
const displayMargin: Vector.IVector2 = { x: 100, y: 100 };
const halfDisplayMargin = Vector.half(displayMargin);

let svgDocument: SVGElement | undefined;
let svgRoot: SVGGElement | undefined;
let viewOffset = Vector.zeroVector;
let contentOffset = Vector.zeroVector;
let scale = 1;
let dragging = false;
let dragOffset = Vector.zeroVector;

class Builder implements IBuilder {
    private readonly _parent: SVGGElement;

    constructor() {
        this._parent = document.createElementNS("http://www.w3.org/2000/svg", "g");
    }

    public addElement(className: Utils.Dom.ClassName, position: Vector.Position): IElement {
        return new GroupElement(this._parent, className, position);
    }

    public build(): Element {
        return this._parent;
    }
}

class GroupElement implements IElement {
    private readonly _svgGroup: SVGElement;
    private readonly _className: Utils.Dom.ClassName;
    private readonly _position: Vector.Position;

    constructor(parent: Element, className: Utils.Dom.ClassName, position: Vector.Position) {
        this._svgGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        this._svgGroup.classList.add(className);
        this._svgGroup.setAttribute("transform", `translate(${position.x}, ${position.y})`);
        parent.appendChild(this._svgGroup);

        this._className = className;
        this._position = position;
    }

    get className(): Utils.Dom.ClassName {
        return this._className;
    }

    get position(): Vector.Position {
        return this._position;
    }

    public addElement(className: Utils.Dom.ClassName, position: Vector.Position): IElement {
        return new GroupElement(this._svgGroup, className, position);
    }

    public addRect(className: Utils.Dom.ClassName, size: Vector.Size, position: Vector.Position): void {
        const pathElem = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        pathElem.setAttribute("class", className);
        pathElem.setAttribute("x", position.x.toString());
        pathElem.setAttribute("y", position.y.toString());
        pathElem.setAttribute("width", size.x.toString());
        pathElem.setAttribute("height", size.y.toString());

        this._svgGroup.appendChild(pathElem);
    }

    public addText(
        className: Utils.Dom.ClassName,
        value: string,
        position: Vector.Position,
        size: Vector.Size): void {

        const textElement = Utils.Dom.createWithText("code", value);
        textElement.className = `noselect ${className}`;
        this.addForeignObject(position, size, textElement);
    }

    public addEditableText(
        className: Utils.Dom.ClassName,
        value: string,
        position: Vector.Position,
        size: Vector.Size,
        callback: (newValue: string) => void): void {

        const inputElement = Utils.Dom.createTextInput(value, callback);
        inputElement.className = className;
        this.addForeignObject(position, size, inputElement);
    }

    public addEditableNumber(
        className: Utils.Dom.ClassName,
        value: number,
        position: Vector.Position,
        size: Vector.Size,
        callback: (newValue: number) => void): void {

        const inputElement = Utils.Dom.createNumberInput(value, callback);
        inputElement.className = className;
        this.addForeignObject(position, size, inputElement);
    }

    public addEditableBoolean(
        className: Utils.Dom.ClassName,
        value: boolean,
        position: Vector.Position,
        size: Vector.Size,
        callback: (newValue: boolean) => void): void {

        const inputElement = Utils.Dom.createBooleanInput(value, callback);
        inputElement.className = className;
        this.addForeignObject(position, size, inputElement);
    }

    public addDropdown(
        className: Utils.Dom.ClassName,
        currentIndex: number,
        options: ReadonlyArray<string>,
        position: Vector.Position,
        size: Vector.Size,
        callback: (newIndex: number) => void): void {

        const selectElement = Utils.Dom.createSelectInput(currentIndex, options, callback);
        selectElement.className = className;
        this.addForeignObject(position, size, selectElement);
    }

    public addBezier(
        className: Utils.Dom.ClassName,
        from: Vector.Position,
        c1: Vector.Position,
        c2: Vector.Position,
        to: Vector.Position): void {

        const pathElem = document.createElementNS("http://www.w3.org/2000/svg", "path");
        pathElem.setAttribute("class", className);
        pathElem.setAttribute("d", `M${from.x},${from.y} C${c1.x},${c1.y} ${c2.x},${c2.y} ${to.x},${to.y}`);

        this._svgGroup.appendChild(pathElem);
    }

    public addGraphics(
        className: Utils.Dom.ClassName,
        graphicsId: string,
        position: Vector.Position,
        clickCallback?: () => void): void {

        const useElem = document.createElementNS("http://www.w3.org/2000/svg", "use");
        useElem.setAttribute("class", className);
        useElem.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", `#${graphicsId}`);
        useElem.setAttribute("x", position.x.toString());
        useElem.setAttribute("y", position.y.toString());
        if (clickCallback !== undefined) {
            useElem.onclick = clickCallback;
        }
        this._svgGroup.appendChild(useElem);
    }

    private addForeignObject(position: Vector.Position, size: Vector.Size, htmlElement: HTMLElement): void {
        const foreignObject = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
        foreignObject.setAttribute("x", position.x.toString());
        // + 3 here because the foreign objects seem to render too low on most browsers.
        foreignObject.setAttribute("y", (position.y - Utils.half(size.y) + 2).toString());
        foreignObject.setAttribute("width", size.x.toString());
        foreignObject.setAttribute("height", size.y.toString());
        foreignObject.appendChild(htmlElement);

        this._svgGroup.appendChild(foreignObject);
    }
}

/** Get the size of the current window */
function getDisplaySize(): Vector.IVector2 {
    assertInitialized();
    const bounds = svgDocument!.getBoundingClientRect();
    return { x: bounds.width, y: bounds.height };
}

/** Get the total size of the current content */
function getContentSize(): Vector.IVector2 {
    assertInitialized();
    const contentSize = svgRoot!.getBBox();
    return { x: contentSize.width, y: contentSize.height };
}

/**
 * Set the global content scale (Can be used for zooming).
 * @param newScale New global content scale.
 */
function setScale(newScale: number): void {
    assertInitialized();
    scale = clampScale(newScale);
    updateRootTransform();
}

/**
 * Set the new global offset (Can be used to pan the content).
 * @param newOffset New global offset.
 */
function setOffset(newOffset: Vector.IVector2): void {
    assertInitialized();
    viewOffset = newOffset;
    updateRootTransform();
}

function updateRootTransform(): void {
    if (svgRoot !== undefined) {
        svgRoot.setAttribute("transform", `translate(${viewOffset.x}, ${viewOffset.y})scale(${scale})`);
    }
}

function clampScale(newScale: number): number {
    return Utils.clamp(newScale, minScale, maxScale);
}

function assertInitialized(): void {
    if (svgDocument === undefined || svgRoot === undefined) {
        throw new Error("Display hasn't been initialized");
    }
}
