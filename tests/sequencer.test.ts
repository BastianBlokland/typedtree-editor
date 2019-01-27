import * as Sequencer from "../src/sequencer";
import { sleep } from "../src/utils";

test("stopEndsTheUntilEndPromise", () => {
    let sequencer = Sequencer.createRunner();
    expect(sequencer.running).toBe(true);
    expect(sequencer.idle).toBe(true);

    sequencer.stop();
    return sequencer.untilEnd.then(() => {
        expect(sequencer.running).toBe(false);
    })
});

test("allItemsGetExecuted", () => {
    let sequencer = Sequencer.createRunner();
    let counter = 0;

    sequencer.enqueue(async () => { counter++ });
    sequencer.enqueue(async () => { counter++ });
    sequencer.enqueue(async () => { counter++ });
    sequencer.enqueue(async () => { counter++ });
    sequencer.enqueue(async () => { counter++ });

    return sleep(5).then(() => expect(counter).toBe(5));
});

test("idlePromiseIsResolved", () => {
    let sequencer = Sequencer.createRunner();

    let executed = false;
    sequencer.enqueue(async () => { await sleep(5); executed = true; });

    return waitAndAssert();

    async function waitAndAssert(): Promise<void> {
        await sleep(1);
        await sequencer.untilIdle;
        expect(executed).toBe(true);
    }
});
