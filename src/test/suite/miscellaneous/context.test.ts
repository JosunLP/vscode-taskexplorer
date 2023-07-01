/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-unused-expressions */

import { expect } from "chai";
import { ITeWrapper } from ":types";
import { activate, endRollingCount, exitRollingCount, suiteFinished } from "../../utils/utils";

let teWrapper: ITeWrapper;

const enum ContextKeys
{
	ActionPrefix = "taskexplorer:action:",
	KeyPrefix = "taskexplorer:key:",
	TreeViewPrefix = "taskexplorer:treeView:",
	WebviewPrefix = "taskexplorer:webview:",
	WebviewViewPrefix = "taskexplorer:webviewView:",
	Dev = "taskexplorer:dev",
	Disabled = "taskexplorer:disabled",
	Enabled = "taskexplorer:enabled",
	Untrusted = "taskexplorer:untrusted",
	licensePage = "taskexplorer:licensePage",
	ParsingReport = "taskexplorer:parsingReport",
	ReleaseNotes = "taskexplorer:releaseNotes",
	TaskFiles = "taskexplorer:taskFiles",
	Tests = "taskexplorer:tests",
	TestsTest = "taskexplorer:testsTest"
}


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
        expect(teWrapper.contextTe.getContext<boolean>(ContextKeys.Enabled)).to.be.a("boolean").that.is.equal(true);
        expect(teWrapper.contextTe.getContext<boolean>(ContextKeys.Dev)).to.be.a("boolean").that.is.equal(false);
        expect(teWrapper.contextTe.getContext<boolean>(ContextKeys.Dev, true)).to.be.a("boolean").that.is.equal(true);
        expect(teWrapper.contextTe.getContext<boolean>(ContextKeys.Dev, false)).to.be.a("boolean").that.is.equal(false);
        expect(teWrapper.contextTe.getContext<string>(ContextKeys.TestsTest)).to.be.undefined;
        expect(teWrapper.contextTe.getContext<string>(ContextKeys.TestsTest, "testing")).to.be.a("string").that.is.equal("testing");
        endRollingCount(this);
    });


    test("Set Context", async function()
    {
        if (exitRollingCount(this)) return;
        await teWrapper.contextTe.setContext(ContextKeys.TestsTest, "testing");
        expect(teWrapper.contextTe.getContext<string>(ContextKeys.TestsTest)).to.be.a("string").that.is.equal("testing");
        await teWrapper.contextTe.setContext(ContextKeys.TestsTest, undefined);
        endRollingCount(this);
    });

});
