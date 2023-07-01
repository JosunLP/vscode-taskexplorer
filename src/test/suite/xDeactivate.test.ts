
import { activate, cleanup, endRollingCount, exitRollingCount, testControl } from "../utils/utils";


suite("Deactivate Extension", () =>
{
	suiteSetup(async function()
    {
        if (exitRollingCount(this, true)) return;
		await activate();
        endRollingCount(this, true);
	});

	test("Cleanup", async function()
	{
		this.slow(testControl.slowTime.general.cleanup);
		await cleanup();
	});

});
