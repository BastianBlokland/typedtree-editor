import * as Utils from "./utils";
import * as DomUtils from "./domutils";
import * as Vec from "./vector";
import * as SvgJs from "svg.js";

declare const SVG: typeof SvgJs;

/** Html class identifier */
export type ClassName = string;

/** Display element that content can be added to. */
export interface Element {
    /** Html class identifier for this element */
    readonly className: string
    /** Position of this element.
     * Note: This does NOT need to match screen pixels as the canvas can be zoomed. */
    readonly position: Vec.Position

    /** Add a child element */
    addElement(className: ClassName, position: Vec.Position): Element

    /** Add a rectangle graphic to this element. */
    addRect(className: ClassName, size: Vec.Size, position: Vec.Position): void

    /** Add a text graphic to this element.
     * Note: Position is vertically centered. */
    addText(className: ClassName, text: string, position: Vec.Position): void

    /** Add a line graphic to this element. */
    addLine(className: ClassName, from: Vec.Position, to: Vec.Position): void

    /** Add a bezier graphic to this element. */
    addBezier(className: ClassName, from: Vec.Position, c1: Vec.Position, c2: Vec.Position, to: Vec.Position): void

    /** Add a circle graphic to this element.
     * Note: Position represents the center of the circle. */
    addCircle(className: ClassName, radius: number, position: Vec.Position): void
}

/** Initialize the display, needs to be done once. */
export function initialize(): void {
    if (svgDocument != null || svgRoot != null)
        throw new Error("Already initialized");

    if (document.getElementById(rootSvgDomElement) == null)
        throw new Error(`No dom element found with id: ${rootSvgDomElement}`);

    if (!SVG.supported)
        throw new Error("Svg not supported");

    // Create document
    svgDocument = SVG(rootSvgDomElement);
    svgRoot = svgDocument.group();

    // Setup global listeners
    window.ondragstart = _ => false; // Disable native dragging as it interferes with ours.
    window.onkeydown = event => {
        switch (event.key) {
            case "f": focusContent(); break;
        }
    };
    window.onmousedown = event => {
        dragOffset = Vec.subtract(viewOffset, { x: event.clientX, y: event.clientY });
        dragging = true;
    };
    window.onmouseup = () => {
        dragging = false;
    };
    window.onmousemove = event => {
        if (dragging)
            setOffset(Vec.add(dragOffset, { x: event.clientX, y: event.clientY }));
    };
    window.onwheel = event => {
        // Get data from the event
        const scrollDelta = -(<WheelEvent>event).deltaY * scrollScaleSpeed;
        const pointerPos: Vec.Position = { x: (<WheelEvent>event).pageX, y: (<WheelEvent>event).pageY };

        // Calculate new-scale and offset to zoom-in to where the user was pointing
        const newScale = clampScale(scale + scrollDelta);
        const zoomFactor = (newScale - scale) / scale;
        const offsetToPointer = Vec.subtract(pointerPos, viewOffset);
        const offsetDelta = Vec.multiply(offsetToPointer, -zoomFactor);

        // Apply new scale and offset
        setScale(newScale);
        setOffsetDelta(offsetDelta);
    };

    // Setup button listeners
    DomUtils.subscribeToClick("focus-button", focusContent);
}

/**
 * Create a new root display element.
 * @param className Html class identifier for this element.
 * @param  position Position to place the element at.
 * @returns Element
 */
export function createElement(className: ClassName, position: Vec.Position): Element {
    assertInitialized();
    return new GroupElement(svgRoot!, className, position);
}

/** Get the size of the current window */
export function getDisplaySize(): Vec.Vector2 {
    assertInitialized();
    const bounds = svgDocument!.rbox();
    return { x: bounds.width, y: bounds.height };
}

/** Get the total size of the current content */
export function getContentSize(): Vec.Vector2 {
    assertInitialized();
    const contentSize = svgRoot!.bbox();
    return { x: contentSize.width, y: contentSize.height };
}

/**
 * Set the global content scale (Can be used for zooming).
 * @param newScale New global content scale.
 */
export function setScale(newScale: number): void {
    assertInitialized();
    scale = clampScale(newScale);
    svgRoot!.scale(scale, scale, 0, 0);
}

/**
 * Offset the current content by the given delta.
 * @param offsetDelta Delta to move the content by.
 */
export function setOffsetDelta(offsetDelta: Vec.Vector2): void {
    setOffset(Vec.add(viewOffset, offsetDelta));
}

/**
 * Set the new global offset (Can be used to pan the content).
 * @param newOffset New global offset.
 */
export function setOffset(newOffset: Vec.Vector2): void {
    assertInitialized();
    viewOffset = newOffset;
    svgRoot!.translate(newOffset.x, newOffset.y);
}

/** Focus on the current content (Will be centered and scaled to fit). */
export function focusContent(): void {
    assertInitialized();
    const displaySize = Vec.subtract(getDisplaySize(), displayMargin);
    const contentSize = getContentSize();

    // Calculate new scale
    setScale(Math.min(displaySize.x / contentSize.x, displaySize.y / contentSize.y));

    // Calculate offset to center the content
    const actualContentSize = Vec.multiply(contentSize, scale);
    setOffset(Vec.add(halfDisplayMargin, Vec.half(Vec.subtract(displaySize, actualContentSize))));
}

/** Clear all content from this display. */
export function clear(): void {
    assertInitialized();
    svgRoot!.clear();
}

const rootSvgDomElement = "svg-display";
const minScale = 0.1;
const maxScale = 3;
const scrollScaleSpeed = 0.001;
const displayMargin: Vec.Vector2 = { x: 75, y: 75 };
const halfDisplayMargin = Vec.half(displayMargin);

let svgDocument: SvgJs.Doc | undefined;
let svgRoot: SvgJs.G | undefined;
let viewOffset = Vec.zeroVector;
let scale = 1;
let dragging = false;
let dragOffset = Vec.zeroVector;

class GroupElement implements Element {
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

    addElement(className: ClassName, position: Vec.Position): Element {
        return new GroupElement(this._svgGroup, className, position);
    }

    addRect(className: ClassName, size: Vec.Size, position: Vec.Position): void {
        this._svgGroup.rect(size.x, size.y).
            x(position.x).
            y(position.y).
            addClass(className);
    }

    addText(className: ClassName, text: string, position: Vec.Position): void {
        this._svgGroup.group().
            x(position.x).
            y(position.y).
            text(b => {
                /* NOTE: Using dy offset here to center vertically, reason why we not just use:
                'dominant-baseline' is that its not supported on edge */

                b.tspan(text).dy("0.6ex");
            }).
            addClass(className);
    }

    addLine(className: ClassName, from: Vec.Position, to: Vec.Position): void {
        this._svgGroup.line(from.x, from.y, to.x, to.y).
            addClass(className);
    }

    addBezier(className: ClassName, from: Vec.Position, c1: Vec.Position, c2: Vec.Position, to: Vec.Position): void {
        this._svgGroup.path(`M${from.x},${from.y} C${c1.x},${c1.y} ${c2.x},${c2.y} ${to.x},${to.y}`).
            addClass(className);
    }

    addCircle(className: ClassName, radius: number, center: Vec.Position): void {
        this._svgGroup.circle(radius).
            addClass(className).
            x(center.x - Utils.half(radius)).
            y(center.y - Utils.half(radius));
    }
}

function clampScale(newScale: number): number {
    return Utils.clamp(newScale, minScale, maxScale);
}

function assertInitialized(): void {
    if (svgDocument == undefined || svgRoot == undefined)
        throw new Error("Display hasn't been initialized");
}
