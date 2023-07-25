/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-unused-expressions */

import { expect } from "chai";
import { ITeWrapper } from ":types";
import { activate, endRollingCount, exitRollingCount, suiteFinished } from "../../utils/utils";

let teWrapper: ITeWrapper;


suite("Context Tests", () =>
{

    suiteSetup(async function()
    {
        if (exitRollingCount(this, true)) return;
        ({ teWrapper } = await activate());
        endRollingCount(this, true);
    });


    suiteTeardown(async function()
    {
        if (exitRollingCount(this, false, true)) return;
        suiteFinished(this);
    });


    test("Get Context", async function()
    {
        if (exitRollingCount(this)) return;
        expect(teWrapper.contextTe.getContext<boolean>(teWrapper.keys.Context.Enabled)).to.be.a("boolean").that.is.equal(true);
        expect(teWrapper.contextTe.getContext<boolean>(teWrapper.keys.Context.Dev)).to.be.a("boolean").that.is.equal(false);
        expect(teWrapper.contextTe.getContext<boolean>(teWrapper.keys.Context.Dev, true)).to.be.a("boolean").that.is.equal(false);
        expect(teWrapper.contextTe.getContext<string>(teWrapper.keys.Context.TestsTest)).to.be.undefined;
        expect(teWrapper.contextTe.getContext<string>(teWrapper.keys.Context.TestsTest, "testing")).to.be.a("string").that.is.equal("testing");
        endRollingCount(this);
    });


    test("Set Context", async function()
    {
        if (exitRollingCount(this)) return;
        await teWrapper.contextTe.setContext(teWrapper.keys.Context.TestsTest, "testing");
        expect(teWrapper.contextTe.getContext<string>(teWrapper.keys.Context.TestsTest)).to.be.a("string").that.is.equal("testing");
        await teWrapper.contextTe.setContext(teWrapper.keys.Context.TestsTest, undefined);
        endRollingCount(this);
    });

});
