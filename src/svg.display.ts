/**
 * @file Responsible for creating svg display elements and updating them.
 */

import * as SvgJs from "svg.js";
import * as DomUtils from "./domutils";
import { ClassName } from "./domutils";
import * as Utils from "./utils";
import * as Vec from "./vector";

declare const SVG: typeof SvgJs;

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
    addText(className: ClassName, text: string, position: Vec.Position): void;

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

    /** Add a line graphic to this element. */
    addLine(className: ClassName, from: Vec.Position, to: Vec.Position): void;

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
    rootSvgDom.ondragstart = _ => false; // Disable native dragging as it interferes with ours.
    window.onmousedown = event => {
        handleMoveStart({ x: event.clientX, y: event.clientY });
        event.preventDefault();
    };
    window.ontouchstart = event => {
        handleMoveStart({ x: event.touches[0].clientX, y: event.touches[0].clientY });
        event.preventDefault();
    };
    window.onmousemove = event => {
        handleMoveUpdate({ x: event.clientX, y: event.clientY });
        event.preventDefault();
    };
    window.ontouchmove = event => {
        handleMoveUpdate({ x: event.touches[0].clientX, y: event.touches[0].clientY });
        event.preventDefault();
    };
    window.onmouseup = event => {
        handleMoveEnd();
        event.preventDefault();
    };
    window.ontouchend = event => {
        handleMoveEnd();
        event.preventDefault();
    };
    rootSvgDom.onwheel = event => {
        const scrollDelta = -(event as WheelEvent).deltaY * scrollScaleSpeed;
        const pointerPos: Vec.Position = { x: (event as WheelEvent).pageX, y: (event as WheelEvent).pageY };
        handleScroll(scrollDelta, pointerPos);
    };

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
 * Create a new root display element.
 * @param className Html class identifier for this element.
 * @param  position Position to place the element at.
 * @returns Element
 */
export function createElement(className: ClassName, position: Vec.Position): IElement {
    assertInitialized();
    return new GroupElement(svgRoot!, className, position);
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

/** Clear all content from this display. */
export function clear(): void {
    assertInitialized();
    svgRoot!.clear();
    dragging = false;
}

const rootSvgDomElementId = "svg-display";
const inputBlockerDomElementId = "input-blocker";
const graphicsFilePath = "graphics.svg";
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

class GroupElement implements IElement {
    private readonly _svgGroup: SvgJs.G;
    private readonly _className: ClassName;
    private readonly _position: Vec.Position;

    constructor(svgContainer: SvgJs.Container, className: ClassName, position: Vec.Position) {
        this._svgGroup = svgContainer.group().x(position.x).y(position.y);
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
        this._svgGroup.rect(size.x, size.y).
            x(position.x).
            y(position.y).
            addClass(className);
    }

    public addText(className: ClassName, text: string, position: Vec.Position): void {
        this._svgGroup.group().
            x(position.x).
            y(position.y).
            text(b => {
                /* NOTE: Using dy offset here to center vertically, reason why we not just use:
                'dominant-baseline' is that its not supported on edge */
                b.tspan(text).dy("0.6ex");
            }).
            addClass(className).
            addClass("noselect");
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

    public addLine(className: ClassName, from: Vec.Position, to: Vec.Position): void {
        this._svgGroup.line(from.x, from.y, to.x, to.y).
            addClass(className);
    }

    public addBezier(
        className: ClassName,
        from: Vec.Position,
        c1: Vec.Position,
        c2: Vec.Position,
        to: Vec.Position): void {

        this._svgGroup.path(`M${from.x},${from.y} C${c1.x},${c1.y} ${c2.x},${c2.y} ${to.x},${to.y}`).
            addClass(className);
    }

    public addGraphics(
        className: ClassName,
        graphicsId: string,
        position: Vec.Position,
        clickCallback?: () => void): void {

        const elem = this._svgGroup.use(graphicsId, graphicsFilePath).
            addClass(className).
            x(position.x).
            y(position.y);
        if (clickCallback !== undefined) {
            elem.click(clickCallback);
        }
    }

    private addForeignObject(position: Vec.Position, size: Vec.Size, htmlElement: HTMLElement): void {
        this._svgGroup.group().
            element("foreignObject").
            x(position.x).
            y(position.y - Utils.half(size.y)).
            width(size.x).
            height(size.y).
            node.appendChild(htmlElement);
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
    svgRoot!.node.setAttribute("transform", `translate(${viewOffset.x}, ${viewOffset.y})scale(${scale})`);
}

function clampScale(newScale: number): number {
    return Utils.clamp(newScale, minScale, maxScale);
}

function assertInitialized(): void {
    if (svgDocument === undefined || svgRoot === undefined) {
        throw new Error("Display hasn't been initialized");
    }
}
