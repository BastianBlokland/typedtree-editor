import * as Utils from "./utils";
import * as Vec from "./vector";
import * as SvgJs from "svg.js";

declare const SVG: typeof SvgJs;

export type ClassName = string;

export interface Element {
    readonly className: string
    readonly position: Vec.Position

    addElement(className: ClassName, position: Vec.Position): Element
    addRect(className: ClassName, size: Vec.Size, position: Vec.Position): void
    addText(className: ClassName, text: string, position: Vec.Position): void
    addLine(className: ClassName, from: Vec.Position, to: Vec.Position): void
    addBezier(className: ClassName, from: Vec.Position, c1: Vec.Position, c2: Vec.Position, to: Vec.Position): void
    addCircle(className: ClassName, radius: number, position: Vec.Position): void
}

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

    // Setup listeners
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
        let scrollDelta = -(<WheelEvent>event).deltaY * scrollScaleSpeed;
        let pointerPos: Vec.Position = { x: (<WheelEvent>event).pageX, y: (<WheelEvent>event).pageY };

        // Calculate new-scale and offset to zoom-in to where the user was pointing
        let newScale = Utils.clamp(scale + scrollDelta, minScale, maxScale);
        let zoomFactor = (newScale - scale) / scale;
        let offsetToPointer = Vec.subtract(pointerPos, viewOffset);
        let offsetDelta = Vec.multiply(offsetToPointer, -zoomFactor);

        // Apply new scale and offset
        setScale(newScale);
        setOffsetDelta(offsetDelta);
    };
}

export function createElement(className: ClassName, rectangle: Vec.Position): Element {
    assertInitialized();
    return new GroupElement(svgRoot!, className, rectangle);
}

export function getDisplaySize(): Vec.Vector2 {
    assertInitialized();
    let bounds = svgDocument!.rbox();
    return { x: bounds.width, y: bounds.height };
}

export function getContentSize(): Vec.Vector2 {
    assertInitialized();
    let contentSize = svgRoot!.bbox();
    return { x: contentSize.width, y: contentSize.height };
}

export function setScale(newScale: number): void {
    assertInitialized();
    scale = Utils.clamp(newScale, minScale, maxScale);
    svgRoot!.scale(scale, scale, 0, 0);
}

export function setOffsetDelta(offsetDelta: Vec.Vector2): void {
    setOffset(Vec.add(viewOffset, offsetDelta));
}

export function setOffset(newOffset: Vec.Vector2): void {
    assertInitialized();
    viewOffset = newOffset;
    svgRoot!.translate(newOffset.x, newOffset.y);
}

export function focusContent(): void {
    assertInitialized();
    let displaySize = Vec.subtract(getDisplaySize(), displayMargin);
    let contentSize = getContentSize();
    let horFitScale = displaySize.x / contentSize.x;
    let verFitScale = displaySize.y / contentSize.y;

    setScale(Math.min(horFitScale, verFitScale));
    if (horFitScale < verFitScale) {
        setOffset(Vec.add(Vec.half(displayMargin), { x: 0, y: (verFitScale - horFitScale) * displaySize.y }));
    }
    else {
        setOffset(Vec.add(Vec.half(displayMargin), { x: (horFitScale - verFitScale) * displaySize.y, y: 0 }));
    }
}

export function clear(): void {
    assertInitialized();
    svgRoot!.clear();
}

const rootSvgDomElement = "svg-display";
const minScale: number = 0.1;
const maxScale: number = 3;
const scrollScaleSpeed: number = 0.005;
const displayMargin: Vec.Vector2 = { x: 75, y: 75 };

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
            plain(text).
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

function assertInitialized(): void {
    if (svgDocument == undefined || svgRoot == undefined)
        throw new Error("Display hasn't been initialized");
}
