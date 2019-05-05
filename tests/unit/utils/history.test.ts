/**
 * @file Jest tests for utils/history.ts
 */

import * as Utils from "../../../src/utils";

test("undoRestoresPreviousValues", () => {
    const history = Utils.History.createHistoryStack<number>(5);
    expect(history.current).toBe(undefined);

    history.push(1);
    history.push(2);
    history.push(3);
    expect(history.current).toBe(3);

    expect(history.hasUndo).toBe(true);
    history.undo();
    expect(history.current).toBe(2);

    expect(history.hasUndo).toBe(true);
    history.undo();
    expect(history.current).toBe(1);

    expect(history.hasUndo).toBe(false);
    history.undo();
    expect(history.current).toBe(1);
});

test("redoRestoresFutureValues", () => {
    const history = Utils.History.createHistoryStack<number>(5);
    expect(history.current).toBe(undefined);

    history.push(1);
    history.push(2);
    history.push(3);
    expect(history.current).toBe(3);

    history.undo();
    history.undo();
    expect(history.current).toBe(1);

    expect(history.hasRedo).toBe(true);
    history.redo();
    expect(history.current).toBe(2);

    expect(history.hasRedo).toBe(true);
    history.redo();
    expect(history.current).toBe(3);

    expect(history.hasRedo).toBe(false);
    history.redo();
    expect(history.current).toBe(3);
});

test("previousHistoryGetsDiscardedWhenPushingAfterUndo", () => {
    const history = Utils.History.createHistoryStack<number>(5);
    expect(history.current).toBe(undefined);

    history.push(1);
    history.push(2);
    history.push(3);
    expect(history.current).toBe(3);

    history.undo();
    history.undo();
    expect(history.current).toBe(1);

    history.push(4);
    expect(history.current).toBe(4);

    history.push(5);
    expect(history.current).toBe(5);

    history.undo();
    expect(history.current).toBe(4);
    history.undo();
    expect(history.current).toBe(1);
    history.undo();
    expect(history.current).toBe(1);
});

test("tooLongHistoryGetsTruncated", () => {
    const history = Utils.History.createHistoryStack<number>(3);
    expect(history.current).toBe(undefined);

    history.push(1);
    history.push(2);
    history.push(3);
    history.push(4);
    history.push(5);
    expect(history.current).toBe(5);

    history.undo();
    expect(history.current).toBe(4);

    history.undo();
    expect(history.current).toBe(3);

    expect(history.hasUndo).toBe(false);
    history.undo();
    expect(history.current).toBe(3);
});

test("clearWipesAllHistory", () => {
    const history = Utils.History.createHistoryStack<number>(3);
    expect(history.current).toBe(undefined);

    history.push(1);
    history.push(2);
    history.push(3);

    expect(history.current).toBe(3);

    history.clear();
    expect(history.current).toBe(undefined);
});

test("prunePastPreservesCorrectCurrent", () => {
    const history = Utils.History.createHistoryStack<number>(3);
    expect(history.current).toBe(undefined);

    history.push(1);
    history.push(2);
    history.push(3);

    expect(history.current).toBe(3);

    // Prune 1 and 2 from the history.
    history.prune(n => n > 2);

    expect(history.current).toBe(3);
    expect(history.hasUndo).toBe(false);
});

test("pruneFuturePreservesCorrectCurrent", () => {
    const history = Utils.History.createHistoryStack<number>(3);
    expect(history.current).toBe(undefined);

    history.push(1);
    history.push(2);
    history.push(3);
    history.undo();
    history.undo();

    expect(history.current).toBe(1);

    // Prune 2 and 3 from the history.
    history.prune(n => n === 1);

    expect(history.current).toBe(1);
    expect(history.hasRedo).toBe(false);
});

test("prunePastAndFuturePreservesCorrectCurrent", () => {
    const history = Utils.History.createHistoryStack<number>(5);
    expect(history.current).toBe(undefined);

    history.push(1);
    history.push(2);
    history.push(3);
    history.push(4);
    history.push(5);
    history.undo();
    history.undo();

    expect(history.current).toBe(3);

    // Prune 1 and 5 from the history.
    history.prune(n => n !== 1 && n !== 5);

    expect(history.current).toBe(3);
    expect(history.hasUndo).toBe(true);
    expect(history.hasRedo).toBe(true);
});
