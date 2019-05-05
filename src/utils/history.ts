/**
 * @file HistoryStack can be used to keep a history for undo / redo purposes.
 * Usage:
 * - Create a HistoryStack
 * - On modifications push new items to it.
 * - Call undo and get the current from the HistoryStack.
 */

export interface IHistoryStack<T> {
    /** Current item in the history. */
    current: T | undefined;

    /** Is there anything to undo in the history. */
    hasUndo: boolean;

    /** Is there anything to redo in the history. */
    hasRedo: boolean;

    /**
     * Add new items to the history.
     * @param items New items to add to the history.
     */
    push(...items: T[]): void;

    /** Move the current item back to one before. */
    undo(): void;

    /** Move the current item forward to one later. */
    redo(): void;

    /** Clear all the items from the history */
    clear(): void;

    /** Delete all items that do not match the given predicate */
    prune(predicate: (state: T) => boolean): void;

    /** Perform the given mutation on all elements in the history */
    map(mutation: (state: T) => T): void;
}

/**
 * Create a new HistoryStack.
 * @param maxSize Maximum number of elements in the history.
 * @returns Newly created HistoryStack.
 */
export function createHistoryStack<T>(maxSize: number): IHistoryStack<T> {
    return new HistoryStackImpl(maxSize);
}

class HistoryStackImpl<T> implements IHistoryStack<T> {
    private readonly _maxSize: number;
    private _items: T[] = [];
    private _currentIndex: number = -1;

    constructor(maxSize: number) {
        this._maxSize = maxSize;
    }

    get current(): T | undefined {
        if (this._currentIndex < 0) {
            return undefined;
        }
        return this._items[this._currentIndex];
    }

    get hasUndo(): boolean {
        return this._currentIndex > 0;
    }

    get hasRedo(): boolean {
        return this._items.length > 0 && this._currentIndex < (this._items.length - 1);
    }

    public push(...items: T[]): void {
        // Slice of items after currentIndex (as we are starting a alternate history) and remove
        // items from the front if the collection is too big.
        if (this._items.length > 0) {
            this._items = this._items.slice(
                Math.max(0, (this._currentIndex + items.length + 1) - this._maxSize),
                this._currentIndex + 1);
        }
        // Add the new items.
        this._items.push(...items);
        // Set the last item to be the current.
        this._currentIndex = this._items.length - 1;
    }

    public undo(): void {
        if (this._currentIndex > 0) {
            this._currentIndex--;
        }
    }

    public redo(): void {
        if (this._items.length > 0 && this._currentIndex < (this._items.length - 1)) {
            this._currentIndex++;
        }
    }

    public clear(): void {
        this._items = [];
        this._currentIndex = -1;
    }

    public prune(predicate: (state: T) => boolean): void {
        // Apply predicate to entire history.
        for (let i: number = 0; i < this._items.length; i++) {
            // If item does not match predicate then remove it.
            if (!predicate(this._items[i])) {
                if (this._currentIndex >= i) {
                    this._currentIndex--;
                }
                this._items.splice(i, 1);
                i--;
            }
        }
    }

    public map(mutation: (state: T) => T): void {
        this._items = this._items.map(mutation);
    }
}
