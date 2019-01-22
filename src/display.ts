import * as Utils from "./utils";
import * as Vec from "./vector";
import * as svgjs from "svg.js";

declare const SVG: typeof svgjs;

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

    svgDocument = SVG(rootSvgDomElement);
    svgRoot = svgDocument.group();
}

export function createElement(className: ClassName, rectangle: Vec.Position): Element {
    assertInitialized();
    return new GroupElement(svgRoot!, className, rectangle);
}

export function clear(): void {
    assertInitialized();
    svgRoot!.clear();
}

const rootSvgDomElement = "svg-display";

let svgDocument: svgjs.Doc | undefined;
let svgRoot: svgjs.G | undefined;

class GroupElement implements Element {
    private readonly _svgGroup: svgjs.G;
    private readonly _className: ClassName;
    private readonly _position: Vec.Position;

    constructor(svgContainer: svgjs.Container, className: ClassName, position: Vec.Position) {
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
