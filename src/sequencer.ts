export type SequenceItem = () => Promise<void>

export interface SequenceRunner {
    readonly running: boolean
    readonly idle: boolean
    readonly untilIdle: Promise<void>
    readonly untilEnd: Promise<void>

    enqueue(item: SequenceItem): void
    stop(): void
}

export function createRunner(): SequenceRunner {
    return new SequenceRunnerImpl();
}

type ResolveItem = (value?: void | PromiseLike<void>) => void

class SequenceRunnerImpl implements SequenceRunner {
    private _untilEnd: Promise<void>;

    private _untilNext: Promise<void>;
    private _resolveNext: ResolveItem;

    private _untilIdle: Promise<void>;
    private _resolveIdle: ResolveItem;

    private _idle: boolean = true;
    private _running: boolean = true;
    private _items: SequenceItem[] = [];

    constructor() {
        this.resetUntilIdle();
        this.resetUntilNext();
        this._untilEnd = this.run();
    }

    get running(): boolean {
        return this._running;
    }

    get idle(): boolean {
        return this._idle;
    }

    get untilIdle(): Promise<void> {
        return this._untilIdle;
    }

    get untilEnd(): Promise<void> {
        return this._untilEnd;
    }

    enqueue(item: SequenceItem): void {
        this._items.push(item);
        this._resolveNext();
    }

    stop(): void {
        this._running = false;
        this._resolveNext();
    }

    private async run(): Promise<void> {
        while (this._running) {
            this._idle = true;
            this._resolveIdle();

            await this._untilNext;

            this._idle = false;
            this.resetUntilIdle();

            while (this._running && this._items.length > 0)
                await this._items.shift()!();
            this.resetUntilNext();
        }
    }

    private resetUntilIdle(): void {
        this._untilIdle = new Promise((resolve, _) => {
            this._resolveIdle = resolve;
        });
    }

    private resetUntilNext(): void {
        this._untilNext = new Promise((resolve, _) => {
            this._resolveNext = resolve;
        });
    }
}
