
import { join } from "path";
import { env } from "process";
import { expect } from "chai";
import { ITeWrapper } from ":types";
import { commands, Uri, workspace, WorkspaceFolder } from "vscode";
import { executeSettingsUpdate } from "../../utils/commandUtils";
import {
	activate, testControl, logErrorsAreFine, suiteFinished, exitRollingCount, getWsPath, endRollingCount, sleep, overrideNextShowInputBox
} from "../../utils/utils";

let rootUri: Uri;
let teWrapper: ITeWrapper;


suite("Util Tests", () =>
{

	suiteSetup(async function()
    {
        if (exitRollingCount(this, true)) return;
        ({ teWrapper } = await activate());
		rootUri = (workspace.workspaceFolders as WorkspaceFolder[])[0].uri;
        await executeSettingsUpdate("logging.enable", true);
        await executeSettingsUpdate("logging.enableOutputWindow", true);
		await executeSettingsUpdate("logging.level", 3);
        endRollingCount(this, true);
	});


	suiteTeardown(async function()
	{
        if (exitRollingCount(this, false, true)) return;
        suiteFinished(this);
	});


    test("Miscellaneous", async function()
    {
        if (exitRollingCount(this)) return;
        await teWrapper.pathUtils.getInstallPath();
		const now = Date.now();
		teWrapper.utils.formatDate(now, "datetime");
		teWrapper.utils.formatDate(now, "date");
		teWrapper.utils.formatDate(now, "time");
		teWrapper.utils.formatDate(now);
		teWrapper.utils.getRandomNumber();
		teWrapper.utils.getRandomNumber(5);
		teWrapper.utils.getRandomNumber(100, 1);
        endRollingCount(this);
    });


    test("Utilities", async function()
    {
        if (exitRollingCount(this)) return;
		this.slow((testControl.slowTime.config.event * 2) + 30);
		teWrapper.utils.emptyFn();
		//
		// properCase
		//
        expect(teWrapper.utils.properCase("taskexplorer")).to.be.equal("Taskexplorer");
        expect(teWrapper.utils.properCase(undefined)).to.be.equal("");
		expect(teWrapper.utils.properCase("dc is here", true)).to.be.equal("DcIsHere");
		expect(teWrapper.utils.properCase("dc is here", false)).to.be.equal("Dc Is Here");
		expect(teWrapper.utils.properCase("dc is here")).to.be.equal("Dc Is Here");
		expect(teWrapper.utils.properCase("dc was here", true)).to.be.equal("DcWasHere");
		expect(teWrapper.utils.properCase("dc was here", false)).to.be.equal("Dc Was Here");
		expect(teWrapper.utils.properCase(undefined)).to.equal("");
		expect(teWrapper.utils.properCase("")).to.equal("");
		//
		// Type utils
		//
		expect(teWrapper.typeUtils.isPrimitive(33)).to.be.equal(true);
		expect(teWrapper.typeUtils.isArray([], false)).to.be.equal(false);
		expect(teWrapper.typeUtils.isArray([])).to.be.equal(true);
		expect(teWrapper.typeUtils.isArray([ 1 ], false)).to.be.equal(true);
		// expect(teWrapper.typeUtils.isError(33)).to.be.equal(false);
		// expect(teWrapper.typeUtils.isError(33)).to.be.equal(false);
		// expect(teWrapper.typeUtils.isError(new Error("Test"))).to.be.equal(true);
		expect(teWrapper.typeUtils.isDate(33)).to.be.equal(false);
		expect(teWrapper.typeUtils.isDate(new Date())).to.be.equal(true);
		expect(teWrapper.typeUtils.isObject({}));
		expect(teWrapper.typeUtils.isObject({test: 1 }));
		expect(teWrapper.typeUtils.isObject(new Object()));
		expect(!teWrapper.typeUtils.isObject("string"));
		expect(teWrapper.typeUtils.isObjectEmpty(null)).to.be.equal(true);
		expect(teWrapper.typeUtils.asArray(1, true)).to.be.an("array").with.length(1);
		expect(teWrapper.typeUtils.asArray(1)).to.be.an("array").with.length(1);
		expect(teWrapper.typeUtils.asArray([ 1, 2, 3 ], true)).to.be.an("array").with.length(3);
		expect(teWrapper.typeUtils.asArray([ 1, 2, 3 ], false)).to.be.an("array").with.length(3);
		expect(teWrapper.typeUtils.asArray([ 1, 2, 3 ])).to.be.an("array").with.length(3);
		expect(teWrapper.typeUtils.asArray(undefined)).to.be.an("array").with.length(0);
		expect(teWrapper.typeUtils.asArray("", false, true)).to.be.an("array").with.length(1);
		expect(teWrapper.typeUtils.asArray("", false, false)).to.be.an("array").with.length(0);
		expect(teWrapper.typeUtils.asArray("")).to.be.an("array").with.length(0);
		expect(teWrapper.typeUtils.asArray([ 1 ], true)).to.be.an("array").with.length(1);
		expect(teWrapper.typeUtils.asString("")).to.be.equal("");
		expect(teWrapper.typeUtils.asString(undefined)).to.be.equal("");
		expect(teWrapper.typeUtils.asString("test")).to.be.equal("test");
		expect(teWrapper.typeUtils.isEmpty([])).to.be.equal(true);
		expect(teWrapper.typeUtils.isEmpty("")).to.be.equal(true);
		expect(teWrapper.typeUtils.isEmpty("", true)).to.be.equal(false);
		expect(teWrapper.typeUtils.isEmpty({ a: 1 })).to.be.equal(false);
		expect(teWrapper.typeUtils.isEmpty({})).to.be.equal(true);
		expect(teWrapper.typeUtils.isPromise(null)).to.be.equal(false);
		expect(teWrapper.typeUtils.isPromise(new Promise((r, j) => r(true)))).to.be.equal(true);
		expect(teWrapper.typeUtils.isPromise(teWrapper.utils.sleep(5))).to.be.equal(true);
		expect(teWrapper.typeUtils.isPromise({ dispose: () => {} })).to.be.equal(false);
		expect(teWrapper.typeUtils.isPromise({ then: () => {} })).to.be.equal(true);
		//
		// Merge / Clone
		//
		teWrapper.objUtils.apply({}, undefined as any);
		teWrapper.objUtils.apply(undefined as any, {});
		teWrapper.objUtils.apply({}, {});
		teWrapper.objUtils.apply({ a: 1 }, {});
		teWrapper.objUtils.apply({ a: 1, b: { a: 1 }}, { a: 2 });
		teWrapper.objUtils.apply({ a: 1, b: { a: 1 }}, { a: 2, c: { b: 2 }}, { b: 2 });
		teWrapper.objUtils.clone(undefined);
		teWrapper.objUtils.clone({});
		teWrapper.objUtils.clone({ a: 1 });
		teWrapper.objUtils.clone({ a: 1, b: { a: 1 } });
		teWrapper.objUtils.clone([ 1, 2 ]);
		teWrapper.objUtils.clone(new Date());
		// teWrapper.objUtils.merge({}, {});
		// teWrapper.objUtils.merge({ a: 1, b: 2 }, { c: 3 });
		// teWrapper.objUtils.merge({ a: 1, b: { c: 1 } }, { b: { d: 1 }, c: 3 });
		// teWrapper.objUtils.merge({ a: 1, b: { c: 1 } }, { b: { c: 2, d: 1 }, c: 3 });
		// teWrapper.objUtils.merge({ a: 1, b: [ 1, 2 ] }, { b: [ 3, 4 ], c: 3 });
		// teWrapper.objUtils.merge({ a: 1, b: [ 1, 2 ] }, { a: 2, b: [ 3, 4 ], c: 3 });
		// teWrapper.objUtils.merge({ a: 1, b: [ 1, 2 ] }, { a: { a: 2 }, b: [ 3, 4 ], c: 3 });
		// teWrapper.objUtils.merge({ a: 1, b: [ 1, 2 ] }, { b: [ 1 ], c: 3, d: new Date() });
		// teWrapper.objUtils.merge({ a: 1, b: [{ a: 1 }] }, { b: [{ b: 1 }], c: 3 });
		// teWrapper.objUtils.merge({ a: 1, b: [{ a: 1 }], c: { a: 1 }}, { b: [{ a: 2 }]});
		// teWrapper.objUtils.merge({ a: 1, b: [{ a: 1 }], c: { a: 1 }, d: new Date()}, { a: [ 1 ], c: { a: 1 }});
		// teWrapper.objUtils.merge({ a: 1, b: [{ a: 1 }], c: { a: 1 }, d: new Date()}, { a: [ 1 ], b: { a: 1 }});
		// teWrapper.objUtils.merge({ a: 1, b: { a: 1 }, c: { a: 1 }, d: new Date()}, { a: [ 1 ], b: [{ a: 1 }]});
		// teWrapper.objUtils.merge({ a: 1, b: { a: 1 }, c: { a: 1 }, d: new Date()}, { a: [ 1 ], b: 1});
		// teWrapper.objUtils.merge({ a: 1, b: [{ a: 1 }], c: { a: 1 }, d: new Date()}, { a: [ 1 ], b: [{ b: 2 }]});
		// teWrapper.objUtils.merge({ a: 1, b: [ 1 ], c: { a: 1 }, d: new Date()}, { a: [ 1 ], b: [ 2 ]});
		// teWrapper.objUtils.mergeIf({}, {});
		// teWrapper.objUtils.mergeIf({ a: 1, b: 2 }, { c: 3 });
		// teWrapper.objUtils.mergeIf({ a: 1, b: { c: 1 } }, { b: { d: 1 }, c: 3 });
		// teWrapper.objUtils.mergeIf({ a: 1, b: { c: 1 } }, { b: { c: 2, d: 1 }, c: 3 });
		// teWrapper.objUtils.mergeIf({ a: 1, b: [ 1, 2 ] }, { b: [ 3, 4 ], c: 3 });
		// teWrapper.objUtils.mergeIf({ a: 1, b: [ 1, 2 ] }, { b: [ 1 ], c: 3, d: new Date() });
		// teWrapper.objUtils.mergeIf({ a: 1, b: [{ a: 1 }] }, { b: [{ b: 1 }], c: 3 });
		// teWrapper.objUtils.mergeIf({ a: 1, b: [{ a: 1 }], c: { a: 1 }}, { b: [{ a: 2 }]});
		// teWrapper.objUtils.mergeIf({ a: 1, b: [{ a: 1 }], c: { a: 1 }, d: new Date()}, { a: [ 1 ], c: { a: 1 }});
		// teWrapper.objUtils.mergeIf({ a: 1, b: [{ a: 1 }], c: { a: 1 }, d: new Date()}, { a: [ 1 ], c: { a: 1 }});
		//
		// promptRestart
		//
		const originalFn = commands.executeCommand;
		try {
			commands.executeCommand = async <T>(args: any) => { return args as T; };
			overrideNextShowInputBox("Restart", true);
			await teWrapper.utils.promptRestart("Test restart message 1", () => {});
			overrideNextShowInputBox("Cancel");
			await teWrapper.utils.promptRestart("Test restart message 2", async () => { await teWrapper.utils.sleep(1); });
		}
		finally {
			commands.executeCommand = originalFn;
		}
		//
		// wrap()
		//
		let wasException = false;
		teWrapper.utils.wrap(() => {}, [ () => {} ], this);
		expect(teWrapper.utils.wrap(() => "testWrap", [ teWrapper.log.error ], this)).to.be.equal("testWrap");
		expect(teWrapper.utils.wrap(() => { return 4; }, [ teWrapper.log.error ], this)).to.be.equal(4);
		teWrapper.utils.wrap((..._args: string[]) => {}, [ teWrapper.log.error ], this, "A", "B", "C", "D");
		expect(teWrapper.utils.wrap((a: number, b: number, c: number) => a + b + c, [ teWrapper.log.error ], undefined, 1, 2, 3)).to.be.equal(6);
		try {
			teWrapper.utils.wrap(() => { throw new Error("Test error A"); }, [ (a: number, s: string) => {}, 12, "str" ], this);
		}
		catch { wasException = true; }
		expect(wasException).to.be.equal(false);
		try {
			teWrapper.utils.wrap(() => { throw new Error("Test error B"); }, null, this);
		}
		catch { wasException = true; }
		expect(wasException).to.be.equal(true);
		wasException = false;
		try {
			teWrapper.utils.wrap(() => { throw new Error("Test error C"); }, [ teWrapper.log.error ], this);
		}
		catch { wasException = true; }
		expect(wasException).to.be.equal(false);
		wasException = false;
		try {
			teWrapper.utils.wrap((_n1: number, _n2: number) => { throw new Error("Test error D"); }, [ teWrapper.log.error ], this, 1, 2);
		}
		catch { wasException = true; }
		expect(wasException).to.be.equal(false);
		wasException = false;
		try {
			await teWrapper.utils.wrap(async () => { await teWrapper.utils.sleep(1); return 1 / 0; }, [ () => {} ], this);
		}
		catch { wasException = true; }
		expect(wasException).to.be.equal(false);
        expect(await teWrapper.utils.wrap(async () => { await teWrapper.utils.sleep(1); return 1; }, [ () => {}, () => {} ], this)).to.be.equal(1);
		await teWrapper.utils.wrap(() => { return new Promise<any>((r, rej) => { rej(new Error("Test async error 1")); }); }, [ () => {} ], this);
		expect(await teWrapper.utils.wrap(async () => { await teWrapper.utils.sleep(1); return "done"; }, [ teWrapper.log.error, () => {} ], this)).to.be.equal("done");
		expect(await teWrapper.utils.wrap(async () => { await teWrapper.utils.sleep(1); return "done"; }, [ teWrapper.log.error, async () => { await teWrapper.utils.sleep(1); } ], this)).to.be.equal("done");
		expect(await teWrapper.utils.wrap(async () => { await teWrapper.utils.sleep(1); throw new Error("Test async error 1.1"); }, [ (e) => { return "safe catch 1.1"; }, async () => { await teWrapper.utils.sleep(1); } ], this)).to.be.equal("safe catch 1.1");
		expect(await teWrapper.utils.wrap(async () => { await teWrapper.utils.sleep(1); throw new Error("Test async error 1.2"); }, [ async (e) => { await teWrapper.utils.sleep(1); return "safe catch 1.2"; }, async () => { await teWrapper.utils.sleep(1); } ], this)).to.be.equal("safe catch 1.2");
		expect(await teWrapper.utils.wrap(() => { throw new Error("Test async error 1.3"); }, [ async (e) => { await teWrapper.utils.sleep(1); return "safe catch 1.3"; }, async () => { await teWrapper.utils.sleep(1); } ], this)).to.be.equal("safe catch 1.3");
		expect(await teWrapper.utils.wrap(() => { throw new Error("Test async error 1.4"); }, [ () => "safe catch 1.4", async () => { await teWrapper.utils.sleep(1); } ], this)).to.be.equal("safe catch 1.4");
		wasException = false;
		try {
			expect(await teWrapper.utils.wrap(async () => { throw new Error("Test async error 2"); }, [ (e) => { return "safe catch"; }, () => {} ], this)).to.be.equal("safe catch");
		}
		catch (e) { console.log(e); wasException = true; }
		expect(wasException).to.be.equal(false);
		wasException = false;
		try {
			expect(await teWrapper.utils.wrap(async () =>
				{ throw new Error("Test async error 3"); }, [ async (e: any) => { await teWrapper.utils.sleep(1); return e.message; } ], this
			)).to.be.equal("Test async error 3");
		}
		catch (e) { console.log(e); wasException = true; }
		expect(wasException).to.be.equal(false);
		wasException = false;
		try {
			await teWrapper.utils.wrap(async () => { throw new Error("Test async error 4"); });
		}
		catch { wasException = true; }
		expect(wasException).to.be.equal(true);
		wasException = false;
		try {
			await teWrapper.utils.wrap(async () => { throw new Error("Test async error 5"); }, undefined, this);
		}
		catch { wasException = true; }
		expect(wasException).to.be.equal(true);
		wasException = false;
		await teWrapper.utils.wrap(async () => { await teWrapper.utils.sleep(1); throw new Error("Test async error 6"); }, [ teWrapper.log.error ], this);
		try {
			expect(await teWrapper.utils.wrap(() => { return new Promise<any>((_r) => { throw new Error("Test async error 7"); }); }, [ async () => { await teWrapper.utils.sleep(1); } ], this)).to.be.equal(undefined);
		}
		catch { wasException = true; }
		expect(wasException).to.be.equal(false);
		wasException = false;
		try {
			expect(await teWrapper.utils.wrap(() => { throw new Error("Test async error 8"); }, [ async (e: any) => { await teWrapper.utils.sleep(1); return e.message; } ], this)).to.be.equal("Test async error 8");
		}
		catch { wasException = true; }
		expect(wasException).to.be.equal(false);
		wasException = false;
		try {
			expect(await teWrapper.utils.wrap(() => { return new Promise<any>((_r) => { throw new Error("Test async error 9"); }); }, [ async (_e, p) => { await teWrapper.utils.sleep(1); return p; }, "p1" ], this)).to.be.equal("p1");
		}
		catch { wasException = true; }
		expect(wasException).to.be.equal(false);
		wasException = false;
		try {
			expect(await teWrapper.utils.wrap(() => { throw new Error("Test async error 10"); }, [ async (e: any, p) => { await teWrapper.utils.sleep(1); return e.message + "_" + p; }, "param1" ], this)).to.be.equal("Test async error 10_param1");
		}
		catch { wasException = true; }
		expect(wasException).to.be.equal(false);
		//
		// execIf
		//
		teWrapper.utils.execIf(false, () => {});
		teWrapper.utils.execIf(true, () => {});
		teWrapper.utils.execIf(null, () => {}, this);
		teWrapper.utils.execIf(false, () => {}, this);
		teWrapper.utils.execIf(true, () => {}, this);
		teWrapper.utils.execIf(true, () => {}, this, null, 1, 2, 3);
		teWrapper.utils.execIf(true, () => {}, this, null, () => {}, 2, 3);
		teWrapper.utils.execIf(false, () => {}, this, null,  () => {}, 2, 3, 4);
		teWrapper.utils.execIf(true, () => {}, this, [ () => {}, 2, 3 ], 4);
		teWrapper.utils.execIf(false, () => {}, this, [ () => {}, 2, 3, 4 ]);
		//
		// execIf2
		//
		teWrapper.utils.execIf2(false, () => {});
		teWrapper.utils.execIf2(true, () => {});
		teWrapper.utils.execIf2(null, () => {}, this);
		teWrapper.utils.execIf2(false, () => {}, this);
		teWrapper.utils.execIf2(true, () => {}, this);
		teWrapper.utils.execIf2(true, () => {}, this, null, 1, 2, 3);
		teWrapper.utils.execIf2(true, () => {}, this, null, () => {}, 2, 3);
		teWrapper.utils.execIf2(false, () => {}, this, null,  () => {}, 2, 3, 4);
		teWrapper.utils.execIf2(true, () => {}, this, [ () => {}, 2, 3 ], 4);
		teWrapper.utils.execIf2(false, () => {}, this, [ () => {}, 2, 3, 4 ]);
		//
		// throwIf
		//
		teWrapper.utils.throwIf(false, Error, "err msg no throw");
		try { teWrapper.utils.throwIf(true, Error, "err msg throws"); } catch {}

        expect(teWrapper.taskUtils.isScriptType("batch"));
        expect(teWrapper.taskUtils.getScriptTaskTypes().length > 0);

        const arr = [ 1, 2, 3, 4, 5 ];
        teWrapper.utils.removeFromArray(arr, 3);
        teWrapper.utils.removeFromArray(arr, 1);
        teWrapper.utils.removeFromArray(arr, 6);
        expect(arr.length).to.be.equal(3);

        expect(teWrapper.pathUtils.getCwd(rootUri)).to.not.be.equal(undefined);
        expect (teWrapper.utils.getGroupSeparator()).to.be.equal("-");
		//
		// lowerCaseFirstChar
		//
		expect(teWrapper.utils.lowerCaseFirstChar("", true)).to.be.equal("");
		expect(teWrapper.utils.lowerCaseFirstChar("s", true)).to.be.equal("s");
		expect(teWrapper.utils.lowerCaseFirstChar("s", false)).to.be.equal("s");
		expect(teWrapper.utils.lowerCaseFirstChar("S", true)).to.be.equal("s");
		expect(teWrapper.utils.lowerCaseFirstChar("S", false)).to.be.equal("s");
		expect(teWrapper.utils.lowerCaseFirstChar("scott meesseman", true)).to.be.equal("scottmeesseman");
		expect(teWrapper.utils.lowerCaseFirstChar("Scott meesseman", false)).to.be.equal("scott meesseman");
		expect(teWrapper.utils.lowerCaseFirstChar("TestApp", true)).to.be.equal("testApp");
		expect(teWrapper.utils.lowerCaseFirstChar("testApp", false)).to.be.equal("testApp");
		expect(teWrapper.utils.lowerCaseFirstChar("test App", true)).to.be.equal("testApp");
		expect(teWrapper.utils.lowerCaseFirstChar(undefined as unknown as string, true)).to.be.equal("");
		//
		// getTaskTypeFriendlyName
		//
		teWrapper.taskUtils.getTaskTypeFriendlyName("Workspace");
		teWrapper.taskUtils.getTaskTypeFriendlyName("Workspace", true);
		teWrapper.taskUtils.getTaskTypeFriendlyName("apppublisher");
		teWrapper.taskUtils.getTaskTypeFriendlyName("apppublisher", true);
		teWrapper.taskUtils.getTaskTypeFriendlyName("tsc");
		teWrapper.taskUtils.getTaskTypeFriendlyName("tsc", true);
		teWrapper.taskUtils.getTaskTypeFriendlyName("ant");
		teWrapper.taskUtils.getTaskTypeFriendlyName("ant", true);
		teWrapper.taskUtils.getTaskTypeFriendlyName("node");
		teWrapper.taskUtils.getTaskTypeFriendlyName("node", true);
		//
		// isNumber
		//
		expect(teWrapper.typeUtils.isNumber(10)).to.equal(true);
		expect(teWrapper.typeUtils.isNumber(0)).to.equal(true);
		expect(teWrapper.typeUtils.isNumber(undefined)).to.equal(false);
		expect(teWrapper.typeUtils.isNumber("not a number")).to.equal(false);
		expect(teWrapper.typeUtils.isNumber({ test: true })).to.equal(false);
		expect(teWrapper.typeUtils.isNumber([ 1, 2 ])).to.equal(false);
		//
		// isObject
		//
		expect(teWrapper.typeUtils.isObject("1")).to.equal(false);
		expect(teWrapper.typeUtils.isObject(1)).to.equal(false);
		expect(teWrapper.typeUtils.isObject([])).to.equal(false);
		expect(teWrapper.typeUtils.isObject([ "1" ])).to.equal(false);
		expect(teWrapper.typeUtils.isObject({ a: 1 })).to.equal(true);
		expect(teWrapper.typeUtils.isObjectEmpty({})).to.equal(true);
		expect(teWrapper.typeUtils.isObjectEmpty({ a: 1 })).to.equal(false);
		//
		// isObjectEmpty
		//
		teWrapper.typeUtils.isObjectEmpty([]);
		teWrapper.typeUtils.isObjectEmpty([ 1, 2 ]);
		teWrapper.typeUtils.isObjectEmpty(this);
		teWrapper.typeUtils.isObjectEmpty(workspace);
		teWrapper.typeUtils.isObjectEmpty(Object.setPrototypeOf({}, { a: 1}));
		teWrapper.typeUtils.isObjectEmpty(Object.setPrototypeOf({ a: 1 }, { b: 1}));
		teWrapper.typeUtils.isObjectEmpty({ ...Object.setPrototypeOf({ a: 1 }, { b: 1}) });
		teWrapper.typeUtils.isObjectEmpty("aaa" as unknown as object);
		teWrapper.typeUtils.isObjectEmpty("" as unknown as object);
		teWrapper.typeUtils.isObjectEmpty(undefined as unknown as object);
		//
		// isPromise
		//
		expect(teWrapper.typeUtils.isPromise(null)).to.be.equal(false);
		expect(teWrapper.typeUtils.isPromise(new Promise((r, j) => r(true)))).to.be.equal(true);
		expect(teWrapper.typeUtils.isPromise(teWrapper.utils.sleep(5))).to.be.equal(true);
		expect(teWrapper.typeUtils.isPromise({ dispose: () => {} })).to.be.equal(false);
		expect(teWrapper.typeUtils.isPromise({ then: () => {} })).to.be.equal(true);
		//
		// getDateDifference
		//
		const d1 = Date.now() - 6400000;
		const d2 = Date.now();
		const dt1 = new Date();
		teWrapper.utils.getDateDifference(d1, d2, "d");
		teWrapper.utils.getDateDifference(d1, d2, "h");
		teWrapper.utils.getDateDifference(d1, d2, "m");
		teWrapper.utils.getDateDifference(d1, d2, "s");
		teWrapper.utils.getDateDifference(d1, d2);
		teWrapper.utils.getDateDifference(dt1, d2, "d");
		teWrapper.utils.getDateDifference(dt1, d2, "h");
		teWrapper.utils.getDateDifference(dt1, d2, "m");
		teWrapper.utils.getDateDifference(dt1, d2, "s");
		teWrapper.utils.getDateDifference(dt1, d2);
		teWrapper.utils.getDateDifference(d1, dt1, "d");
		teWrapper.utils.getDateDifference(d1, dt1, "h");
		teWrapper.utils.getDateDifference(d1, dt1, "m");
		teWrapper.utils.getDateDifference(d1, dt1, "s");
		teWrapper.utils.getDateDifference(d1, dt1);
		teWrapper.utils.getDateDifference(d2, dt1, "d");
		teWrapper.utils.getDateDifference(d2, dt1, "h");
		teWrapper.utils.getDateDifference(d2, dt1, "m");
		teWrapper.utils.getDateDifference(d2, dt1, "s");
		teWrapper.utils.getDateDifference(d2, dt1);
		//
		// textWithElipsis
		//
		teWrapper.utils.textWithElipsis("Shorten this text and append an elipsis", 16);
		teWrapper.utils.textWithElipsis("Don't shorten this text or append an elipsis", 64);
		//
		// Pop / Push fn
		//
		const a = [ "a", "b", "c", "d", "e", "f", "g" ],
			  o = { a: "a", b: "b", c: "c", d: "d", e: "e", f: "f", g: "g" };
		teWrapper.utils.popIfExists(a, "a");
		teWrapper.utils.popIfExists(a, "z");
		teWrapper.utils.popIfExists(a, "a");
		teWrapper.utils.popIfExists(a, "b", "d");
		teWrapper.utils.popIfExists(a, "x", "y", "z");
		teWrapper.utils.popIfExists(a, "f", "q");
		teWrapper.utils.pushIfNotExists(undefined, "w");
		expect(a.length).to.be.equal(3);
		teWrapper.utils.popIfExists(o, "a");
		teWrapper.utils.popIfExists(o, "z");
		teWrapper.utils.popIfExists(o, "a");
		teWrapper.utils.popIfExists(o, "b", "e");
		teWrapper.utils.popIfExists(o, "x", "y", "z");
		teWrapper.utils.popIfExists(o, "f", "q");
		expect(Object.keys(o).length).to.be.equal(3);
		teWrapper.utils.popIfExists(undefined, "f");
		teWrapper.utils.popObjIfExistsBy(o, (v: any) => v === "g");
		expect(Object.keys(o).length).to.be.equal(2);
		teWrapper.utils.popObjIfExistsBy(undefined, (v: any) => v === "c");
		// teWrapper.utils.popIfStartsWith(undefined, "aa");
		// teWrapper.utils.popIfStartsWith([ "abc", "abb", "aabcf", "afd", "aaa" ], "aa");
		teWrapper.utils.popObjIfExistsBy({ a: "b", c: "d", e: "f" }, (v: any) => v === "c", this);
		teWrapper.utils.popObjIfExistsBy({ a: "b", c: "d", e: "f" }, (v: any) => v === "c", this, false);
		teWrapper.utils.popObjIfExistsBy({ a: "b", c: "d", e: "f" }, (v: any) => v === "c", this, true);
		teWrapper.utils.popObjIfExistsBy({ a: "b", c: "d", e: "f" }, (v: any) => v === "c", undefined, true);
		teWrapper.utils.popObjIfExistsBy({ a: "b", c: "d", e: "f" }, (v: any) => v === "nnn", this, true);
		teWrapper.utils.popIfExistsBy([ "a", "b", "c" ], (v: any) => v === "c", this);
		teWrapper.utils.popIfExistsBy([ "a", "b", "c" ], (v: any) => v === "c", undefined, false);
		teWrapper.utils.popIfExistsBy([ "a", "b", "c" ], (v: any) => v === "c", this, false);
		teWrapper.utils.popIfExistsBy([ "a", "b", "c" ], (v: any) => v === "c", this, true);
		teWrapper.utils.popIfExistsBy([ "a", "b", "c" ], (v: any) => v === "c", undefined, true);
		teWrapper.utils.popIfExistsBy([ "a", "b", "c" ], (v: any) => v === "nnn", this, true);
		teWrapper.utils.popIfExistsBy(undefined, (v: any) => v === "nnn", this, true);
		// teWrapper.utils.pushIfNotExistsBy([ "a", "b", "c" ], (v: any) => v === "nnn", this, "b");
		// teWrapper.utils.pushIfNotExistsBy([ "a", "b", "c" ], (v: any) => v === "e", this, "e");
		// teWrapper.utils.pushIfNotExistsBy(undefined, (v: any) => v === "nnn", this, "e");
		//
        endRollingCount(this);
	});


	test("Data Paths", async function()
	{
        if (exitRollingCount(this)) return;
		//
		// The fs module on dev test will run through win32 path get.  Simulate
		// path get here for linux and mac for increased coverage since we're only
		// running the tests in a windows machine for release right now with ap.
		//
		let dataPath: string = teWrapper.pathUtils.getUserDataPath(true, "darwin");
		dataPath = teWrapper.pathUtils.getUserDataPath(true, "linux");

		//
		// Simulate --user-data-dir vscode command line option
		//
		const oArgv = process.argv;
		process.argv = [ "--user-data-dir", dataPath ];
		expect(teWrapper.pathUtils.getUserDataPath(true, "linux")).to.be.equal(dataPath);
		expect(teWrapper.pathUtils.getUserDataPath(true, "win32")).to.be.equal(dataPath);
		expect(teWrapper.pathUtils.getUserDataPath(true, "darwin")).to.be.equal(dataPath);

		//
		// 0 args, which would probably never happen but the teWrapper.pathUtils.getUserDataPath(true, ) call
		// handles it an ;et's cover it
		//
		process.argv = [];
		dataPath = teWrapper.pathUtils.getUserDataPath(true);
		dataPath = teWrapper.pathUtils.getUserDataPath(true, "win32");

		//
		// Save current environment
		//
		dataPath = process.env.VSCODE_PORTABLE as string;
		const dataPath1 = dataPath;
		const dataPath2 = process.env.APPDATA;
		const dataPath3 = process.env.USERPROFILE;
		const dataPath4 = process.env.VSCODE_APPDATA;
		//
		// Set environment variables for specific test
		//
		process.env.VSCODE_PORTABLE = teWrapper.pathUtils.getUserDataPath(true, "win32");
		process.env.APPDATA = "";
		process.env.USERPROFILE = "test";
		dataPath = teWrapper.pathUtils.getUserDataPath(true, "win32");
		expect(dataPath).to.be.equal(`C:\\Projects\\${teWrapper.extensionName}\\.vscode-test\\vscode-win32-x64-archive-${env.vsCodeTestVersion}\\test\\AppData\\Roaming\\vscode`);
		//
		// Set environment variables for specific test
		//
		dataPath = "";
		process.env.VSCODE_PORTABLE = dataPath;
		process.env.APPDATA = dataPath2;
		process.env.USERPROFILE = dataPath3;
		dataPath = teWrapper.pathUtils.getUserDataPath(true, "nothing");
		expect(dataPath).to.be.oneOf([ `C:\\Projects\\${teWrapper.extensionName}\\.vscode-test\\vscode-win32-x64-archive-${env.vsCodeTestVersion}`, "C:\\Code\\data\\user-data\\User\\user-data\\User" ]);
		//
		// Set environment variables for specific test
		//
		process.env.VSCODE_PORTABLE = undefined;
		process.env.APPDATA = dataPath2;
		process.env.USERPROFILE = dataPath3;
		dataPath = teWrapper.pathUtils.getUserDataPath(true);
		dataPath = teWrapper.pathUtils.getUserDataPath(true, "win32");
		expect(dataPath).to.be.equal(`C:\\Users\\${env.USERNAME}\\AppData\\Roaming\\vscode`);
		//
		// Set environment variables for specific test
		//
		process.env.VSCODE_PORTABLE = "c:\\some\\invalid\\path";
		process.env.APPDATA = dataPath2;
		process.env.USERPROFILE = dataPath3;
		dataPath = teWrapper.pathUtils.getUserDataPath(true);
		dataPath = teWrapper.pathUtils.getUserDataPath(true, "win32");
		expect(dataPath).to.be.equal(`C:\\Users\\${env.USERNAME}\\AppData\\Roaming\\vscode`);
		//
		// Set environment variables for specific test
		//
		process.env.VSCODE_PORTABLE = "C:\\Code\\data\\user-data\\User\\workspaceStorage";
		process.env.APPDATA = "";
		process.env.USERPROFILE = "";
		dataPath = teWrapper.pathUtils.getUserDataPath(true);
		dataPath = teWrapper.pathUtils.getUserDataPath(true, "win32");
		expect(dataPath).to.be.equal("C:\\Code\\data\\user-data\\User\\workspaceStorage\\user-data\\User");
		//
		// Set environment variables for specific test
		//
		process.env.VSCODE_PORTABLE = "";
		process.env.APPDATA = "";
		process.env.USERPROFILE = "";
		dataPath = teWrapper.pathUtils.getUserDataPath(true);
		dataPath = teWrapper.pathUtils.getUserDataPath(true, "win32");
		expect(dataPath).to.be.equal(`C:\\Projects\\${teWrapper.extensionName}\\.vscode-test\\vscode-win32-x64-archive-${env.vsCodeTestVersion}\\AppData\\Roaming\\vscode`);
		//
		// Set environment variables for specific test
		//
		process.env.VSCODE_PORTABLE = "";
		process.env.APPDATA = "";
		process.env.USERPROFILE = "";
		process.env.VSCODE_APPDATA = "";
		dataPath = teWrapper.pathUtils.getUserDataPath(true, "linux");
		expect(dataPath).to.be.equal(`C:\\Projects\\${teWrapper.extensionName}\\.vscode-test\\vscode-win32-x64-archive-${env.vsCodeTestVersion}\\.config\\vscode`);
		dataPath = teWrapper.pathUtils.getUserDataPath(true, "win32");
		expect(dataPath).to.be.equal(`C:\\Projects\\${teWrapper.extensionName}\\.vscode-test\\vscode-win32-x64-archive-${env.vsCodeTestVersion}\\AppData\\Roaming\\vscode`);
		dataPath = teWrapper.pathUtils.getUserDataPath(true, "darwin");
		expect(dataPath).to.be.equal(`C:\\Projects\\${teWrapper.extensionName}\\.vscode-test\\vscode-win32-x64-archive-${env.vsCodeTestVersion}\\Library\\Application Support\\vscode`);
		dataPath = teWrapper.pathUtils.getUserDataPath(true, "invalid_platform");
		expect(dataPath).to.be.equal(`C:\\Projects\\${teWrapper.extensionName}\\.vscode-test\\vscode-win32-x64-archive-${env.vsCodeTestVersion}`);
		//
		// Set environment variables for specific test
		//
		process.env.VSCODE_APPDATA = "C:\\Code\\data\\user-data\\User\\workspaceStorage";
		dataPath = teWrapper.pathUtils.getUserDataPath(true, "linux");
		expect(dataPath).to.be.equal("C:\\Code\\data\\user-data\\User\\workspaceStorage\\vscode");
		dataPath = teWrapper.pathUtils.getUserDataPath(true, "win32");
		expect(dataPath).to.be.equal("C:\\Code\\data\\user-data\\User\\workspaceStorage\\vscode");
		dataPath = teWrapper.pathUtils.getUserDataPath(true, "darwin");
		expect(dataPath).to.be.equal("C:\\Code\\data\\user-data\\User\\workspaceStorage\\vscode");
		dataPath = teWrapper.pathUtils.getUserDataPath(true, "invalid_platform");
		expect(dataPath).to.be.equal("C:\\Code\\data\\user-data\\User\\workspaceStorage\\vscode");
		//
		// Set portable / invalid platform
		//
		process.env.VSCODE_PORTABLE = "C:\\Code\\data\\user-data\\User\\workspaceStorage";
		dataPath = teWrapper.pathUtils.getUserDataPath(true, "invalid_platform");
		expect(dataPath).to.be.equal("C:\\Code\\data\\user-data\\User\\workspaceStorage\\user-data\\User");
		//
		// Empty platform (production)
		//
		dataPath = teWrapper.pathUtils.getUserDataPath(true, "");
		process.env.VSCODE_PORTABLE = "";
		dataPath = teWrapper.pathUtils.getUserDataPath(true, "");
		dataPath = teWrapper.pathUtils.getUserDataPath(true);
		//
		//
		// Restore process argv
		//
		process.argv = oArgv;
		//
		// Restore environment
		//
		process.env.VSCODE_PORTABLE = dataPath1;
		process.env.APPDATA = dataPath2;
		process.env.USERPROFILE = dataPath3;
		process.env.VSCODE_APPDATA = dataPath4;

        endRollingCount(this);
	});


	test("File System", async function()
    {
        if (exitRollingCount(this)) return;
		await teWrapper.fs.deleteDir(join(__dirname, "folder1", "folder2", "folder3"));
		await teWrapper.fs.createDir(__dirname);
		try {
			await teWrapper.fs.copyDir(join(__dirname, "folder1"), join(__dirname, "folder2"));
		} catch {}
		try {
			await teWrapper.fs.copyFile(join(__dirname, "folder1", "noFile.txt"), join(__dirname, "folder2"));
		} catch {}
		try {
			await teWrapper.fs.copyDir(join(getWsPath("."), "hello.bat"), join(__dirname, "folder2"));
		} catch {}
		await teWrapper.fs.createDir(join(__dirname, "folder1", "folder2", "folder3", "folder4"));
		await teWrapper.fs.copyDir(join(__dirname, "folder1"), join(__dirname, "folder5"), undefined, true);
		await teWrapper.fs.copyDir(join(__dirname, "folder1"), join(__dirname, "folder6"));
		await teWrapper.fs.copyDir(join(__dirname, "folder1"), join(__dirname, "folder7"), /folder/, true);
		await teWrapper.fs.deleteDir(join(__dirname, "folder1", "folder2", "folder3"));
		await teWrapper.fs.deleteDir(join(__dirname, "folder1"));
		await teWrapper.fs.deleteDir(join(__dirname, "folder5"));
		await teWrapper.fs.deleteDir(join(__dirname, "folder6"));
		await teWrapper.fs.deleteDir(join(__dirname, "folder7"));
		await teWrapper.fs.createDir(join(__dirname, "folder1"));
		await teWrapper.fs.deleteFile(join(__dirname, "folder1", "file1.png"));
		await teWrapper.fs.writeFile(join(__dirname, "folder1", "file1.png"), "");
		try { await teWrapper.fs.readFileAsync(join(__dirname, "folder1", "file1.png")); } catch {}
		try { await teWrapper.fs.readJsonAsync(join(__dirname, "folder1", "file1.png")); } catch {}
		try { teWrapper.fs.readFileSync(join(__dirname, "folder1", "file1.png")); } catch {}
		try { teWrapper.fs.readJsonSync(join(__dirname, "folder1", "file1.png")); } catch {}
		await teWrapper.fs.copyFile(join(__dirname, "folder1", "file1.png"), join(__dirname, "folder1", "file2.png"));
		await teWrapper.fs.copyFile(join(__dirname, "folder1", "file1.png"), join(__dirname, "folder1", "file2.png"));
		await teWrapper.fs.deleteDir(join(__dirname, "folder1"));
		try { await teWrapper.fs.readFileAsync(join(__dirname, "folder1", "file1.png")); } catch {}
		try { teWrapper.fs.readFileSync(join(__dirname, "folder1", "file1.png")); } catch {}
		await teWrapper.fs.numFilesInDirectory(rootUri.fsPath);
		try {
			await teWrapper.fs.numFilesInDirectory(join(rootUri.fsPath, "tasks_test_"));
		}
		catch {}
		await teWrapper.fs.getDateModified(join(__dirname, "folder1", "folder2", "folder3"));
		await teWrapper.fs.getDateModified(join(__dirname, "hello.sh"));
		await teWrapper.fs.getDateModified(__dirname);
		await teWrapper.fs.getDateModified("");
		await teWrapper.fs.getDateModified(null as unknown as string);
		teWrapper.fs.getDateModifiedSync(join(__dirname, "folder1", "folder2", "folder3"));
		teWrapper.fs.getDateModifiedSync(join(__dirname, "hello.sh"));
		teWrapper.fs.getDateModifiedSync(__dirname);
		teWrapper.fs.getDateModifiedSync("");
		teWrapper.fs.getDateModifiedSync(null as unknown as string);
		try { await teWrapper.fs.writeFile(getWsPath("."), "its a dir"); } catch {}
		try { teWrapper.fs.writeFileSync(getWsPath("."), "its a dir"); } catch {}
        endRollingCount(this);
	});


    test("Storage", async function()
    {
        if (exitRollingCount(this)) return;
		this.slow(500);
        if (teWrapper.storage)
        {
			const disposable1 = teWrapper.storage.onDidChange(() => {});
			try {
				await teWrapper.storage.update("TEST_KEY", "This is a test");
				expect(teWrapper.storage.get<string>("TEST_KEY")).to.be.equal("This is a test");
				expect(teWrapper.storage.get<string>("TEST_KEY_DOESNT_EXIST", "defValue")).to.be.equal("defValue");
				await teWrapper.storage.update("TEST_KEY", "");
				expect(teWrapper.storage.get<string>("TEST_KEY_DOESNT_EXIST", "defValue")).to.be.equal("defValue");
				await teWrapper.storage.update("TEST_KEY", undefined);
				expect(teWrapper.storage.get<string>("TEST_KEY2_DOESNT_EXIST")).to.be.equal(undefined);
				expect(teWrapper.storage.get<number>("TEST_KEY2_DOESNT_EXIST", 0)).to.be.equal(0);
				expect(teWrapper.storage.get<string>("TEST_KEY2_DOESNT_EXIST", "")).to.be.equal("");
				await sleep(1);
			}
			finally {
				disposable1.dispose();
			}
			expect(teWrapper.storage.get2Sync<string>("storage_test_and_a_ddefault", "default_value")).to.be.equal("default_value");
			expect(teWrapper.storage.get2Sync<string>("storage_test_nodefault")).to.be.equal(undefined);
            await teWrapper.storage.update2("TEST_KEY", "This is a test");
            expect(await teWrapper.storage.get2<string>("TEST_KEY")).to.be.equal("This is a test");
            expect(await teWrapper.storage.get2<string>("TEST_KEY", "some other value")).to.be.equal("This is a test");
            expect(await teWrapper.storage.get2<string>("TEST_KEY_DOESNT_EXIST", "defValue")).to.be.equal("defValue");
            await teWrapper.storage.update2("TEST_KEY", "");
            expect(await teWrapper.storage.get2<string>("TEST_KEY_DOESNT_EXIST", "defValue")).to.be.equal("defValue");
            await teWrapper.storage.update2("TEST_KEY", undefined);
			expect(await teWrapper.storage.get2<string>("TEST_KEY2_DOESNT_EXIST")).to.be.equal(undefined);
			expect(await teWrapper.storage.get2<number>("TEST_KEY2_DOESNT_EXIST", 0)).to.be.equal(0);
			expect(await teWrapper.storage.get2<string>("TEST_KEY2_DOESNT_EXIST", "")).to.be.equal("");
			await teWrapper.storage.updateSecret("testsecret", "test");
			expect(await teWrapper.storage.getSecret("testsecret")).to.be.equal("test");
			const disposable2 = teWrapper.storage.onDidChangeSecret(() => {});
			try {
				await teWrapper.storage.updateSecret("testsecret", "test222");
				expect(await teWrapper.storage.getSecret("testsecret")).to.be.equal("test222");
				await teWrapper.storage.deleteSecret("testsecret");
				// eslint-disable-next-line @typescript-eslint/no-unused-expressions
				expect(await teWrapper.storage.getSecret("testsecret")).to.be.undefined;
				await teWrapper.storage.updateSecret("testsecret", "test333");
				await teWrapper.storage.updateSecret("testsecret", undefined);
				await sleep(1);
			}
			finally {
				disposable2.dispose();
			}
			teWrapper.log.write("STORAGE KEYS: " + teWrapper.storage.keys().join(", "));
        }
        endRollingCount(this);
    });

});
