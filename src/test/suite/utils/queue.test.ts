/* eslint-disable @typescript-eslint/no-unused-expressions */

import { IEventQueue, ITeWrapper } from ":types";
import { activate, endRollingCount, exitRollingCount, suiteFinished } from "../../utils/utils";

let eventQueue: IEventQueue;
let teWrapper: ITeWrapper;


suite("Event Queue Tests", () =>
{

	suiteSetup(async function()
    {
		 if (exitRollingCount(this, true)) return;
        ({ teWrapper } = await activate());
		eventQueue = teWrapper.eventQueue;
        endRollingCount(this, true);
	});


	suiteTeardown(async function()
    {
        if (exitRollingCount(this, false, true)) return;
		while (eventQueue.isBusy("tests")) {
			await teWrapper.utils.sleep(25);
		}
        suiteFinished(this);
	});


	test("Pound Queue", async function()
	{
        if (exitRollingCount(this)) return;
		this.slow(265);
		void queueEvent("test-key", 10);
		void queueEvent("test-key");
		void queueEvent("test-key", 100);
		void queueEvent("test-key");
		void queueEvent("test-key-2");
		void queueEvent("test-key");
		await teWrapper.utils.sleep(10);
		void queueEvent("test-key", 10);
		await teWrapper.utils.sleep(25);
		void queueEvent("test-key-2");
		void queueEvent("test-key-2", 10);
		void queueEvent("test-key-2");
		void queueEvent("test-key", 75);
		await queueEvent("test-key-3");
		void queueEvent("test-key-2");
		void queueEvent("test-key-3");
		await queueEvent("test-key-3");
		void queueEvent("test-key-3");
		void queueEvent("test-key-2");
		await queueEvent("test-key-2");
		void queueEvent("test-key-2");
		await teWrapper.utils.sleep(75);
        endRollingCount(this);
	});

});


let ct = 0;
const queueEvent = (key: string, delay?: number) =>
	eventQueue.queue({ scope: this, fn: () => {}, args: [], owner: "tests", event: key, type: "tests", delay, ignoreActive: ++ct % 3 === 0 });

