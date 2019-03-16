/**
 * @file Jest tests for utils/sequencer.ts
 */

import * as Utils from "../../../src/utils";

test("stopEndsTheUntilEndPromise", () => {
    const sequencer = Utils.Sequencer.createRunner();
    expect(sequencer.running).toBe(true);
    expect(sequencer.idle).toBe(true);

    sequencer.stop();
    return sequencer.untilEnd.then(() => {
        expect(sequencer.running).toBe(false);
    });
});

test("allItemsGetExecuted", () => {
    const sequencer = Utils.Sequencer.createRunner();
    let counter = 0;

    sequencer.enqueue(async () => { counter++; });
    sequencer.enqueue(async () => { counter++; });
    sequencer.enqueue(async () => { counter++; });
    sequencer.enqueue(async () => { counter++; });
    sequencer.enqueue(async () => { counter++; });

    return Utils.sleep(5).then(() => expect(counter).toBe(5));
});

test("idlePromiseIsResolved", () => {
    const sequencer = Utils.Sequencer.createRunner();

    let executed = false;
    sequencer.enqueue(async () => { await Utils.sleep(5); executed = true; });

    return waitAndAssert();

    async function waitAndAssert(): Promise<void> {
        await Utils.sleep(1);
        await sequencer.untilIdle;
        expect(executed).toBe(true);
    }
});
