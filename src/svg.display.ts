/**
 * @file Responsible for creating svg display elements and updating them.
 */

import * as SvgJs from "svg.js";
import * as DomUtils from "./domutils";
import { ClassName } from "./domutils";
import * as Utils from "./utils";
import * as Vec from "./vector";

declare const SVG: typeof SvgJs;

/** Builder that display elements can be added to. */
export interface IBuilder {
    /**
     * Add a new root display element.
     * @param className Html class identifier for this element.
     * @param  position Position to place the element at.
     * @returns Newly created element.
     */
    addElement(className: ClassName, position: Vec.Position): IElement;
}

/** Display element that content can be added to. */
export interface IElement {
    /** Html class identifier for this element */
    readonly className: string;

    /**
     * Position of this element.
     * Note: This does NOT need to match screen pixels as the canvas can be zoomed.
     */
    readonly position: Vec.Position;

    /** Add a child element */
    addElement(className: ClassName, position: Vec.Position): IElement;

    /** Add a rectangle graphic to this element. */
    addRect(className: ClassName, size: Vec.Size, position: Vec.Position): void;

    /**
     * Add a text graphic to this element.
     * Note: Position is vertically centered.
     */
    addText(className: ClassName, value: string, position: Vec.Position, size: Vec.Size): void;

    /**
     * Add a editable text graphic to this element.
     * Note: Position is vertically centered.
     */
    addEditableText(
        className: ClassName,
        value: string,
        position: Vec.Position,
        size: Vec.Size,
        callback: (newValue: string) => void): void;

    /**
     * Add a editable number graphic to this element.
     * Note: Position is vertically centered.
     */
    addEditableNumber(
        className: ClassName,
        value: number,
        position: Vec.Position,
        size: Vec.Size,
        callback: (newValue: number) => void): void;

    /**
     * Add a editable boolean graphic to this element.
     * Note: Position is vertically centered.
     */
    addEditableBoolean(
        className: ClassName,
        value: boolean,
        position: Vec.Position,
        size: Vec.Size,
        callback: (newValue: boolean) => void): void;

    /**
     * Add a editable dropdown graphic to this element.
     * Note: Position is vertically centered.
     */
    addDropdown(
        className: ClassName,
        currentIndex: number,
        options: ReadonlyArray<string>,
        position: Vec.Position,
        size: Vec.Size,
        callback: (newIndex: number) => void): void;

    /** Add a bezier graphic to this element. */
    addBezier(className: ClassName, from: Vec.Position, c1: Vec.Position, c2: Vec.Position, to: Vec.Position): void;

    /** Add a external graphic to this element. */
    addGraphics(
        className: ClassName,
        graphicsId: string,
        position: Vec.Position,
        clickCallback?: (() => void)): void;
}

/** Initialize the display, needs to be done once. */
export function initialize(): void {
    if (svgDocument != null || svgRoot != null) {
        throw new Error("Already initialized");
    }

    const rootSvgDom = document.getElementById(rootSvgDomElementId);
    if (rootSvgDom === null) {
        throw new Error(`No dom element found with id: ${rootSvgDomElementId}`);
    }

    if (!SVG.supported) {
        throw new Error("Svg not supported");
    }

    // Create document
    svgDocument = SVG(rootSvgDomElementId);
    svgRoot = svgDocument.group();

    // Setup global listeners
    const inputBlocker = document.getElementById(inputBlockerDomElementId);
    // Prevent standard 'dragging'
    rootSvgDom.addEventListener("dragstart", event => event.preventDefault(), { passive: false });
    // Disable selecting of elements when 'dragging'
    (document as any).onselectstart = (event: any) => {
        if (dragging) {
            event.preventDefault();
        }
    };

    // Subscribe to both desktop and mobile 'down' events
    rootSvgDom.addEventListener("mousedown", event => {
        handleMoveStart({ x: event.clientX, y: event.clientY });
    }, { passive: true });
    rootSvgDom.addEventListener("touchstart", event => {
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
    rootSvgDom.addEventListener("wheel", event => {
        const scrollDelta = -(event as WheelEvent).deltaY * scrollScaleSpeed;
        const pointerPos: Vec.Position = { x: (event as WheelEvent).pageX, y: (event as WheelEvent).pageY };
        handleScroll(scrollDelta, pointerPos);
    }, { passive: true });

    function handleMoveStart(pointerPos: Vec.Position): void {
        if (DomUtils.isInputFocussed()) {
            return;
        }
        dragOffset = Vec.subtract(viewOffset, pointerPos);
        dragging = true;
    }

    function handleMoveUpdate(pointerPos: Vec.Position): void {
        if (DomUtils.isInputFocussed()) {
            dragging = false;
            return;
        }
        if (dragging) {
            if (inputBlocker !== null) {
                inputBlocker.className = "order-front";
            }
            setOffset(Vec.add(dragOffset, pointerPos));
        }
    }

    function handleMoveEnd(): void {
        dragging = false;
        if (inputBlocker !== null) {
            inputBlocker.className = "order-back";
        }
    }

    function handleScroll(scrollDelta: number, pointerPos: Vec.Position): void {
        if (DomUtils.isInputFocussed()) {
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
    svgRoot!.clear();
    svgRoot!.node.appendChild(newContent);
}

/**
 * Provide a root offset of the content. (Will be used for centering)
 * @param offset Offset to use for centering content
 */
export function setContentOffset(offset: Vec.Position): void {
    contentOffset = offset;
}

/** Focus on the current content (Will be centered and scaled to fit). */
export function focusContent(maxScale?: number): void {
    assertInitialized();
    const displaySize = Vec.subtract(getDisplaySize(), displayMargin);
    const contentSize = getContentSize();

    // Calculate new scale
    let targetScale = Math.min(displaySize.x / contentSize.x, displaySize.y / contentSize.y);
    if (maxScale !== undefined) {
        targetScale = Math.min(targetScale, maxScale);
    }
    setScale(targetScale);

    // Calculate offset to center the content
    const scaledContentSize = Vec.multiply(contentSize, scale);
    const scaledContentOffset = Vec.multiply(contentOffset, scale);
    const centeringOffset = Vec.add(
        Vec.half(Vec.subtract(displaySize, scaledContentSize)),
        Vec.invert(scaledContentOffset));
    setOffset(Vec.add(halfDisplayMargin, centeringOffset));
}

/**
 * Update the zoom, use positive delta for zooming-in and negative delta for zooming-out.
 * @param delta Number indicating how far to zoom. (Use negative numbers for zooming out)
 * @param focalPoint Point to focus on when zooming. (defaults to page center)
 */
export function zoom(delta: number = 0.1, focalPoint?: Vec.Position): void {
    if (focalPoint === undefined) {
        // Default the focalPoint to the page center
        focalPoint = Vec.half(Vec.createVector(window.innerWidth, window.innerHeight));
    }

    // Calculate new-scale and offset to zoom-in to where the user was pointing
    const newScale = clampScale(scale + delta);
    const zoomFactor = (newScale - scale) / scale;
    const offsetToPointer = Vec.subtract(focalPoint, viewOffset);
    const offsetDelta = Vec.multiply(offsetToPointer, -zoomFactor);

    // Apply new scale and offset
    viewOffset = Vec.add(viewOffset, offsetDelta);
    scale = newScale;
    updateRootTransform();
}

const rootSvgDomElementId = "svg-display";
const inputBlockerDomElementId = "input-blocker";
const minScale = 0.05;
const maxScale = 3;
const scrollScaleSpeed = 0.001;
const displayMargin: Vec.IVector2 = { x: 75, y: 75 };
const halfDisplayMargin = Vec.half(displayMargin);

let svgDocument: SvgJs.Doc | undefined;
let svgRoot: SvgJs.G | undefined;
let viewOffset = Vec.zeroVector;
let contentOffset = Vec.zeroVector;
let scale = 1;
let dragging = false;
let dragOffset = Vec.zeroVector;

class Builder implements IBuilder {
    private readonly _parent: SVGGElement;

    constructor() {
        this._parent = document.createElementNS("http://www.w3.org/2000/svg", "g");
    }

    public addElement(className: ClassName, position: Vec.Position): IElement {
        return new GroupElement(this._parent, className, position);
    }

    public build(): Element {
        return this._parent;
    }
}

class GroupElement implements IElement {
    private readonly _svgGroup: SVGElement;
    private readonly _className: ClassName;
    private readonly _position: Vec.Position;

    constructor(parent: Element, className: ClassName, position: Vec.Position) {
        this._svgGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        this._svgGroup.setAttribute("transform", `translate(${position.x}, ${position.y})`);
        parent.appendChild(this._svgGroup);

        this._className = className;
        this._position = position;
    }

    get className(): ClassName {
        return this._className;
    }

    get position(): Vec.Position {
        return this._position;
    }

    public addElement(className: ClassName, position: Vec.Position): IElement {
        return new GroupElement(this._svgGroup, className, position);
    }

    public addRect(className: ClassName, size: Vec.Size, position: Vec.Position): void {
        const pathElem = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        pathElem.setAttribute("class", className);
        pathElem.setAttribute("x", position.x.toString());
        pathElem.setAttribute("y", position.y.toString());
        pathElem.setAttribute("width", size.x.toString());
        pathElem.setAttribute("height", size.y.toString());

        this._svgGroup.appendChild(pathElem);
    }

    public addText(className: ClassName, value: string, position: Vec.Position, size: Vec.Size): void {

        const textElement = DomUtils.createWithText("code", value);
        textElement.className = `noselect ${className}`;
        this.addForeignObject(position, size, textElement);
    }

    public addEditableText(
        className: ClassName,
        value: string,
        position: Vec.Position,
        size: Vec.Size,
        callback: (newValue: string) => void): void {

        const inputElement = DomUtils.createTextInput(value, callback);
        inputElement.className = className;
        this.addForeignObject(position, size, inputElement);
    }

    public addEditableNumber(
        className: ClassName,
        value: number,
        position: Vec.Position,
        size: Vec.Size,
        callback: (newValue: number) => void): void {

        const inputElement = DomUtils.createNumberInput(value, callback);
        inputElement.className = className;
        this.addForeignObject(position, size, inputElement);
    }

    public addEditableBoolean(
        className: ClassName,
        value: boolean,
        position: Vec.Position,
        size: Vec.Size,
        callback: (newValue: boolean) => void): void {

        const inputElement = DomUtils.createBooleanInput(value, callback);
        inputElement.className = className;
        this.addForeignObject(position, size, inputElement);
    }

    public addDropdown(
        className: ClassName,
        currentIndex: number,
        options: ReadonlyArray<string>,
        position: Vec.Position,
        size: Vec.Size,
        callback: (newIndex: number) => void): void {

        const selectElement = DomUtils.createSelectInput(currentIndex, options, callback);
        selectElement.className = className;
        this.addForeignObject(position, size, selectElement);
    }

    public addBezier(
        className: ClassName,
        from: Vec.Position,
        c1: Vec.Position,
        c2: Vec.Position,
        to: Vec.Position): void {

        const pathElem = document.createElementNS("http://www.w3.org/2000/svg", "path");
        pathElem.setAttribute("class", className);
        pathElem.setAttribute("d", `M${from.x},${from.y} C${c1.x},${c1.y} ${c2.x},${c2.y} ${to.x},${to.y}`);

        this._svgGroup.appendChild(pathElem);
    }

    public addGraphics(
        className: ClassName,
        graphicsId: string,
        position: Vec.Position,
        clickCallback?: () => void): void {

        const useElem = document.createElementNS("http://www.w3.org/2000/svg", "use");
        useElem.setAttribute("class", className);
        useElem.setAttribute("href", `#${graphicsId}`);
        useElem.setAttribute("x", position.x.toString());
        useElem.setAttribute("y", position.y.toString());
        if (clickCallback !== undefined) {
            useElem.onclick = clickCallback;
        }
        this._svgGroup.appendChild(useElem);
    }

    private addForeignObject(position: Vec.Position, size: Vec.Size, htmlElement: HTMLElement): void {
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
function getDisplaySize(): Vec.IVector2 {
    assertInitialized();
    const bounds = svgDocument!.rbox();
    return { x: bounds.width, y: bounds.height };
}

/** Get the total size of the current content */
function getContentSize(): Vec.IVector2 {
    assertInitialized();
    const contentSize = svgRoot!.bbox();
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
function setOffset(newOffset: Vec.IVector2): void {
    assertInitialized();
    viewOffset = newOffset;
    updateRootTransform();
}

function updateRootTransform(): void {
    if (svgRoot !== undefined) {
        svgRoot.node.setAttribute("transform", `translate(${viewOffset.x}, ${viewOffset.y})scale(${scale})`);
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
