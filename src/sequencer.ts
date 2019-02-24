/**
 * @file Sequencer can be used to run asynchronous operations in sequence instead of in-parallel.
 * Usage:
 * - Create a sequencer
 * - Enqueue asynchronous operations to the sequencer.
 * - Wait for sequencer completion.
 */

export type SequenceItem = () => Promise<void>;

export interface ISequenceRunner {
    /** Is this runner still running */
    readonly running: boolean;
    /** Is this runner currently waiting for new work items */
    readonly idle: boolean;
    /** Promise that resolves when the runner becomes idle. */
    readonly untilIdle: Promise<void>;
    /** Promise that resolves when this runner is stopped */
    readonly untilEnd: Promise<void>;

    /** Enqueue a new sequence item to the runner. */
    enqueue(item: SequenceItem): void;

    /** Stop the runner (Will stop accepting new items and will resolve the 'untilEnd' promise). */
    stop(): void;
}

/**
 * Construct a new sequence runner
 * @returns new runner
 */
export function createRunner(): ISequenceRunner {
    return new SequenceRunnerImpl();
}

type ResolveItem = (value?: void | PromiseLike<void>) => void;

class SequenceRunnerImpl implements ISequenceRunner {
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

    public enqueue(item: SequenceItem): void {
        this._items.push(item);
        this._resolveNext();
    }

    public stop(): void {
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

            while (this._running && this._items.length > 0) {
                await this._items.shift()!();
            }
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
