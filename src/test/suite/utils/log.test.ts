
import { join } from "path";
import { expect } from "chai";
import { ITeWrapper, ILog, ILogControl } from ":types";
import { executeSettingsUpdate } from "../../utils/commandUtils";
import {
	activate, exitRollingCount, endRollingCount, suiteFinished, testControl, overrideNextShowInfoBox,
	clearOverrideShowInfoBox
} from "../../utils/utils";

let log: ILog,
	writeConsole: boolean,
	writeConsoleLvl: number,
	teWrapper: ITeWrapper,
	logControl: ILogControl,
	runtimeDir: string,
	dbgModuleDir: string,
	teRelModulePath: string,
	rtRelModulePath: string,
	vendorRelModulePath: string,
	teDbgModulePath: string,
	rtDbgModulePath: string,
	vendorDbgModulePath: string,
	tePath: string,
	rtPath: string,
	vendorPath: string;


suite("Logging Tests", () =>
{
	suiteSetup(async function()
    {
        if (exitRollingCount(this, true)) return;
		({ teWrapper } = await activate());
		log = teWrapper.log;
		logControl = teWrapper.logControl;
		writeConsole = logControl.writeToConsole;
		writeConsoleLvl = logControl.writeToConsoleLevel;
        runtimeDir = join(teWrapper.context.extensionUri.fsPath, "dist");
		dbgModuleDir = join(teWrapper.context.globalStorageUri.fsPath, "debug");
		teRelModulePath = join(dbgModuleDir, "taskexplorer.js");
		rtRelModulePath = join(dbgModuleDir, "runtime.js");
		vendorRelModulePath = join(dbgModuleDir, "vendor.js");
		teDbgModulePath = join(dbgModuleDir, "taskexplorer.debug.js");
		rtDbgModulePath = join(dbgModuleDir, "runtime.debug.js");
		vendorDbgModulePath = join(dbgModuleDir, "vendor.debug.js");
		tePath = join(runtimeDir, "taskexplorer.js");
		rtPath = join(runtimeDir, "runtime.js");
		vendorPath = join(runtimeDir, "vendor.js");
		// if (!testControl.isSingleSuiteTest) {
		// 	await teWrapper.config.updateWs(teWrapper.keys.Config.LogEnable, true);
		// }
        endRollingCount(this, true);
	});


	suiteTeardown(async function()
    {
        if (exitRollingCount(this, false, true)) return;
		teWrapper.logControl.writeToConsole = writeConsole;
		teWrapper.logControl.writeToConsoleLevel = writeConsoleLvl;
		log.setWriteToConsole?.(writeConsole, writeConsoleLvl);
		overrideNextShowInfoBox("Cancel", true);
		await teWrapper.config.updateWs(teWrapper.keys.Config.LogEnable, logControl.enable);
		await teWrapper.config.updateWs(teWrapper.keys.Config.LogEnableFile, logControl.enableFile);
		await teWrapper.config.updateWs(teWrapper.keys.Config.LogEnableOutputWindow, logControl.enableOutputWindow);
		await teWrapper.config.updateWs(teWrapper.keys.Config.LogEnableModuleReload, logControl.enableModuleReload);
		await teWrapper.config.updateWs(teWrapper.keys.Config.LogLevel, logControl.level);
		clearOverrideShowInfoBox();
        suiteFinished(this);
	});


    test("Logging (Install Debug Module)", async function()
    {
        if (exitRollingCount(this)) return;
		if (testControl.isSingleSuiteTest)
		{
			this.slow(testControl.slowTime.apiServer.httpGet * 3);
			await teWrapper.fs.deleteFile(teRelModulePath);
			await teWrapper.fs.deleteFile(rtRelModulePath);
			await teWrapper.fs.deleteFile(vendorRelModulePath);
			await teWrapper.fs.deleteFile(teDbgModulePath);
			await teWrapper.fs.deleteFile(rtDbgModulePath);
			await teWrapper.fs.deleteFile(vendorDbgModulePath);
			overrideNextShowInfoBox("Cancel", true);
			await teWrapper.config.updateWs(teWrapper.keys.Config.LogEnable, true);
			await teWrapper.utils.sleep(1000);
		}
        endRollingCount(this);
	});


    test("Logging (Error)", async function()
    {
        if (exitRollingCount(this)) return;
		this.slow((testControl.slowTime.config.event * 5) + 200);
		overrideNextShowInfoBox("Cancel", true);
		await teWrapper.config.updateWs(teWrapper.keys.Config.LogEnable, true);
        teWrapper.log.error(`        ${teWrapper.extensionId}`);
        teWrapper.log.error([ `        ${teWrapper.extensionId}`,
                    `        ${teWrapper.extensionId}`,
                    `        ${teWrapper.extensionId}` ]);
		teWrapper.log.error("");
		teWrapper.log.error("Test5 error");
		teWrapper.log.error(new Error("Test error object"));
		teWrapper.log.error([ "Test error 1", "Test error 2" ]);
		teWrapper.log.error([ "Test error 3", null, "Test error 4", "" ]);
		teWrapper.log.error("Test error 3");
		teWrapper.log.error("Test error 3");
		teWrapper.log.error([ "Test error 3" ]);
		teWrapper.log.error([ "Test error 3" ]);
		teWrapper.log.error([ "Test error 2", "Test error 4" ]);
		teWrapper.log.error([ "Test error 2", "Test error 4" ]);
		teWrapper.log.error([ "Test error 5", "Test error 6" ]);
		teWrapper.log.error([ "Test error 5", "Test error 7" ]);
		teWrapper.log.error("Test error 5");
		teWrapper.log.error([ "", "Test error 5", undefined, "Test error 6", "" ]);
		teWrapper.log.error([ "Test error 7", "", "Test error 8", "" ]);
		teWrapper.log.error([ "Test error 9",  new Error("Test error object 10") ]);
		teWrapper.log.error([ "Test error 11", "Test error 12" ], [[ "Test param error 13", "Test param value 14" ]]);
		teWrapper.log.error("this is a test4", [[ "test6", true ], [ "test6", false ], [ "test7", "1111" ], [ "test8", [ 1, 2, 3 ]]]);
		teWrapper.logControl.blockScaryColors = !testControl.log.blockScaryColors;
		teWrapper.log.error([ "Test error 1", "Test error 2" ]);
		teWrapper.log.error([ "Test error 3", null, "Test error 4", "" ]);
		teWrapper.log.error([ "Test error 3", "Test error 4" ]);
		teWrapper.log.error([ "Test error 3", "Test error 4" ]);
		teWrapper.log.error([ "", "Test error 5", undefined, "Test error 6", "" ]);
		teWrapper.log.error([ "Test error 7", "", "Test error 8", "" ]);
		teWrapper.log.error([ "Test error 3", "Test error 4" ]);
		teWrapper.log.error([ "Test error 3", "Different 2nd Test error than previous" ]);
		teWrapper.log.error([ "Test error 9",  new Error("Test error object 10") ]);
		teWrapper.log.error([ "Test error 11", "Test error 12" ], [[ "Test param error 13", "Test param value 14" ]]);
		teWrapper.log.error("this is a test4", [[ "test6", true ], [ "test6", false ], [ "test7", "1111" ], [ "test8", [ 1, 2, 3 ]]]);
		teWrapper.logControl.blockScaryColors = testControl.log.blockScaryColors;
		teWrapper.logControl.trace = true;
		const err = new Error("Test error object");
		err.stack = undefined;
		teWrapper.log.error(err);
		teWrapper.log.error(true);
		teWrapper.log.error(undefined);
		teWrapper.log.error({
			status: false,
			message: "Test error 15"
		});
		teWrapper.log.error({
			status: false,
			message: "Test error 16",
			messageX: "Test error 16 X"
		});
		teWrapper.log.error({
			status: false,
			messageX: "Test error 16 X"
		});
		teWrapper.log.error({
			status: false
		});
		teWrapper.log.error({
			status: false
		});
		await executeSettingsUpdate("logging.level", 5);
		await executeSettingsUpdate("logging.level", 4);
		teWrapper.logControl.writeToConsole = true;
		teWrapper.log.error("Scary error in console");
		await executeSettingsUpdate("logging.level", testControl.log.level);
		teWrapper.log.error(new Error("Test error object w console"));
		teWrapper.logControl.writeToConsole = false;
		const scaryOff = teWrapper.logControl.blockScaryColors;
		teWrapper.logControl.blockScaryColors = false;
		teWrapper.log.error("Scary error");
		teWrapper.log.error("error line1\nline2");
		teWrapper.log.error("error line1\r\nline2");
		teWrapper.log.error(new Error("Test error object"));
		teWrapper.logControl.trace = false;
		teWrapper.logControl.blockScaryColors = true;
		teWrapper.log.error("Scary error");
		teWrapper.logControl.blockScaryColors = scaryOff;
		const err1 = new Error("Test error object no stack");
		err1.stack = undefined;
		teWrapper.log.error(err1);
		//
		// Disable logging
		//
		overrideNextShowInfoBox("Cancel");
		await executeSettingsUpdate(teWrapper.keys.Config.LogEnable, false);
		teWrapper.log.error("Test5 error");
		teWrapper.log.error("Test5 error");
		teWrapper.log.error(new Error("Test error object"));
		teWrapper.log.error([ "Test error 1", "Test error 2" ]);
		teWrapper.log.error([ "Test error 1", undefined, "Test error 2" ]);
		teWrapper.log.error([ "Test error 1",  new Error("Test error object") ]);
		teWrapper.log.error([ "Test error 1", "Test error 2" ], [[ "Test param error", "Test param value" ]]);
		teWrapper.log.error("this is a test4", [[ "test6", true ], [ "test6", false ], [ "test7", "1111" ], [ "test8", [ 1, 2, 3 ]]]);
		const err2 = new Error("Test error object 2 no stack");
		err2.stack = undefined;
		teWrapper.log.error(err2);
		//
		// Re-enable logging
		//
		overrideNextShowInfoBox("Cancel");
		await executeSettingsUpdate(teWrapper.keys.Config.LogEnable, true);
        endRollingCount(this);
    });


	test("Logging (File)", async function()
    {
        if (exitRollingCount(this)) return;
		this.slow((testControl.slowTime.config.event * 7) + 150);
		overrideNextShowInfoBox("Cancel");
		await teWrapper.config.updateWs(teWrapper.keys.Config.LogEnable, false);
		await teWrapper.config.updateWs(teWrapper.keys.Config.LogEnableFile, false);
		await teWrapper.config.updateWs(teWrapper.keys.Config.LogEnableFile, true);
		await teWrapper.utils.sleep(25);
		overrideNextShowInfoBox("Cancel");
		await teWrapper.config.updateWs(teWrapper.keys.Config.LogEnable, true);
		log.write("Test1", 1);
		log.write2("Test1", "Test1", 1);
		log.value("Test2", "value", 1);
		log.error("Test3 error");
		log.error({});
		log.error("error line1\nline2");
		log.error("error line1\r\nline2");
		log.error(new Error("Test error object"));
		log.error([ "Test error 1", "Test error 2" ]);
		log.error("Test4 error", [[ "p1", "e1" ]]);
		log.write("Test1", 1);
		log.value("Test2", "value", 1);
		log.error("Error1");
		log.warn("Warning1");
		log.value("Test3", "value3", 1);
		overrideNextShowInfoBox("Cancel");
		await teWrapper.config.updateWs(teWrapper.keys.Config.LogEnableFile, false);
		//
		// Disable logging
		//
		overrideNextShowInfoBox("Cancel");
		await teWrapper.config.updateWs(teWrapper.keys.Config.LogEnable, false);
		log.error("Error1");
		log.warn("Warning1");
		log.write2("Test1", "Test1", 1);
		//
		// Re-enable logging
		//
		overrideNextShowInfoBox("Cancel", true);
		await teWrapper.config.updateWs(teWrapper.keys.Config.LogEnable, true);
        endRollingCount(this);
	});


    test("Logging (Method)", async function()
    {
        if (exitRollingCount(this)) return;
		this.slow((testControl.slowTime.config.event * 2) + 75);

		log.methodStart("methodName");
		log.methodDone("methodName");
		log.methodStart("methodName", 1);
		log.methodDone("methodName", 1);
		log.methodStart("methodName", 5, "");
		log.methodDone("methodName", 1, "");
		log.methodStart("methodName", 1, "", false);
		log.methodDone("methodName", 5, "");
		log.methodStart("methodName", 1, "", true);
		log.methodDone("methodName", 1, log.lastPad);
		log.methodStart("methodName", 1, "", false, [[ "p1", "v1" ]]);
		log.methodDone("methodName", 1, "", [[ "p2", "v2" ]]);
		log.methodEvent("message", "tag", 1, [[ "test", "test" ]]);
		log.methodEvent("message", "tag", 1);
		log.methodEvent("message", "tag", 1);
		log.methodEvent("message", "tag", 5);
		log.methodEvent("message");
		log.methodEvent("message", undefined, 1);
		log.methodEvent("message", undefined, 5);
		log.methodStart("methodName", undefined, undefined, false, [[ "1", "1" ]]);
		log.methodDone("methodName", undefined, undefined, [[ "1", "1" ]]);
		log.methodEvent("methodEvent", undefined, undefined, [[ "1", "1" ]]);
		//
		// Disable logging
		//
		overrideNextShowInfoBox("Cancel");
		await teWrapper.config.updateWs(teWrapper.keys.Config.LogEnable, false);
		log.methodStart("methodName");
		log.methodDone("methodName");
		log.methodEvent("methodName");
		//
		// Re-enable logging
		//
		overrideNextShowInfoBox("Cancel");
		await teWrapper.config.updateWs(teWrapper.keys.Config.LogEnable, true);
        endRollingCount(this);
    });


    test("Logging (Miscellaneous)", async function()
    {
        if (exitRollingCount(this)) return;
		expect(teWrapper.log.config.app).to.be.a("string");
		expect(teWrapper.log.control.enable).to.be.equal(true);
		expect(teWrapper.log.state.lastLogPad).to.be.a("string");
        endRollingCount(this);
	});


	test("Logging (Output Window)", async function()
    {
        if (exitRollingCount(this)) return;
		this.slow((testControl.slowTime.config.event * 2) + 50);
		await teWrapper.config.updateWs(teWrapper.keys.Config.LogEnableOutputWindow, true);
		log.write("Test1", 1);
		log.value("Test2", "value", 1);
		log.error("Test5 error");
		log.error(new Error("Test5 error"));
		log.error({});
		log.error(new Error("Test error object"));
		log.error([ "Test error 1", "Test error 2" ]);
		log.error("Test4 error", [[ "p1", "e1" ]]);
		await teWrapper.config.updateWs(teWrapper.keys.Config.LogEnableOutputWindow, false);
		overrideNextShowInfoBox("Cancel", true);
		await teWrapper.config.updateWs(teWrapper.keys.Config.LogEnable, false);
		await teWrapper.config.updateWs(teWrapper.keys.Config.LogEnableOutputWindow, true);
		log.write("Test1", 1);
		log.value("Test2", "value", 1);
		await teWrapper.config.updateWs(teWrapper.keys.Config.LogEnableOutputWindow, false);
		log.write("Test1", 1);
		log.value("Test2", "value", 1);
		log.error("Test5 error");
		log.error({});
		log.error(new Error("Test error object"));
		log.error([ "Test error 1", "Test error 2" ]);
		log.error("Test4 error", [[ "p1", "e1" ]]);
        endRollingCount(this);
	});


	test("Logging (Queue)", async function()
    {
		this.slow((testControl.slowTime.config.event * 2) + 75);

        if (exitRollingCount(this)) return;
		log.dequeue("queueTestId");
		log.write("test1", 1, "", "queueTestId");
		log.write("test2", 1, "", "queueTestId");
		log.write("test3", 1, "", "queueTestId");
		log.value("test3", "value1", 1, "", "queueTestId");
		log.error("test4", undefined, "queueTestId");
		log.error("test5", [[ "param1", 1 ]], "queueTestId");
		log.error("error line1\nline2", undefined, "queueTestId");
		log.error("error line1\r\nline2", undefined, "queueTestId");
		log.write("line1\nline2", 1, "   ", "queueTestId");
		log.write("line1\r\nline2", 1, "   ", "queueTestId");
		log.error(new Error("Test error object"));
		log.dequeue("queueTestId");
		await teWrapper.config.updateWs(teWrapper.keys.Config.LogEnableFile, true);
		log.write("test1", 1, "", "queueTest2Id", false, false);
		log.error("test4", undefined, "queueTest2Id");
		log.value("test3", "value1", 1, "", "queueTest2Id");
		log.error("test5", [[ "param1", 1 ]], "queueTest2Id");
		log.error("error line1\nline2", undefined, "queueTest2Id");
		log.write("line1\nline2", 1, "   ", "queueTestId");
		log.write("line1b\r\nline2b", 1, "   ", "queueTestId");
		log.write("test6\ntest7\ntest8", 1, "", "queueTestId");
		log.dequeue("queueTest2Id");
		await teWrapper.config.updateWs(teWrapper.keys.Config.LogEnableFile, false);
        endRollingCount(this);
	});


    test("Logging (Value)", async function()
    {
        if (exitRollingCount(this)) return;
		this.slow((testControl.slowTime.config.event * 4) + 75);
        log.value(`        ${teWrapper.extensionAuthor}`, null);
        log.value(`        ${teWrapper.extensionId}`, null);
        log.value(`        ${teWrapper.extensionName}`, undefined);
        log.value(`        ${teWrapper.extensionTitle}`, "");
        log.value(`        ${teWrapper.extensionTitleShort}`, "");
		log.value(null as unknown as string, 1);
		log.value(undefined as unknown as string, 1);
		log.value("null value", null);
		log.value("empty array", []);
		log.value("empty object", {});
		log.value("empty string value", teWrapper.log.state.lastLogPad);
		log.value("line break lf value", "line1\nline2");
		log.value("line break crlf value", "line1\r\nline2");
		await teWrapper.config.updateWs(teWrapper.keys.Config.LogEnableOutputWindow, false);
		log.value("null value", null);
		log.value("Test3", "value3", 1);
		await teWrapper.config.updateWs(teWrapper.keys.Config.LogEnableOutputWindow, true);
		log.value("", "");
		log.value("", null);
		log.value("", undefined);
		log.value("undefined value 1", undefined);
		log.value("undefined value 2", undefined, 1);
		log.values(1, "   ", [[ "Test5", "5" ]]);
		log.values(5, "   ", [[ "Test5", "5" ]]);
		log.value("object value", {
			p1: 1,
			p2: "test"
		});
		//
		// Console On
		//
		log.setWriteToConsole?.(true);
		teWrapper.logControl.writeToConsole = true;
		log.value("test", "1");
		log.value("test", "1", 1);
		log.value("test", "1", 5);
		//
		// Console Off
		//
		log.setWriteToConsole?.(false);
		teWrapper.logControl.writeToConsole = false;
		//
		// Disable logging
		//
		overrideNextShowInfoBox("Cancel", true);
		await teWrapper.config.updateWs(teWrapper.keys.Config.LogEnable, false);
		log.value("test", "1");
		log.value(null as unknown as string, 1);
		log.value(undefined as unknown as string, 1);
		log.write("test");
		log.write("Test1", 1);
		log.write("Test1", 1);
		log.value("Test2", "value", 1);
		log.value("Test3", null, 1);
		log.value("Test4", undefined, 1);
		log.values(1, "   ", [[ "Test5", "5" ]]);
		log.values(5, "   ", [[ "Test6", "6" ]]);
		//
		// Re-enable logging
		//
		overrideNextShowInfoBox("Cancel");
		await teWrapper.config.updateWs(teWrapper.keys.Config.LogEnable, true);
        endRollingCount(this);
    });


    test("Logging (Warn)", async function()
    {
        if (exitRollingCount(this)) return;
		this.slow((testControl.slowTime.config.event * 2) + 50);
		log.warn("test1");
		log.warn("test2");
		const scaryOff = logControl.blockScaryColors;
		logControl.blockScaryColors = false;
		log.warn("test3");
		logControl.blockScaryColors = true;
		log.warn("test3");
		logControl.blockScaryColors = scaryOff;
		//
		// Disable logging
		//
		overrideNextShowInfoBox("Cancel");
		await teWrapper.config.updateWs(teWrapper.keys.Config.LogEnable, false);
		log.warn("test1");
		log.warn("test2");
		log.withColor("a", log.colors.grey);
		//
		// Re-enable logging
		//
		overrideNextShowInfoBox("Cancel");
		await teWrapper.config.updateWs(teWrapper.keys.Config.LogEnable, true);
		log.withColor("a", log.colors.grey);
        endRollingCount(this);
    });


    test("Logging (Write)", async function()
    {
        if (exitRollingCount(this)) return;
		this.slow((testControl.slowTime.config.event * 2) + 70);

        log.blank();
        log.blank(1);
		log.write(null as unknown as string);
		log.write(undefined as unknown as string);
		log.write("");
		log.write("");
		log.info("test");
		log.info("");
		//
		// Console On
		//
		log.setWriteToConsole?.(true);
		teWrapper.logControl.writeToConsole = true;
		log.write("test");
		//
		// Console Off
		//
		log.setWriteToConsole?.(false);
		teWrapper.logControl.writeToConsole = false;
		//
		// Trace / integrtated source map suppor for stack tracing of the
		// minified build / typescript source
		//
		const trace = logControl.trace;
		logControl.trace = false;
		log.blank(2);
		log.write("test1");
		log.write2("Test1", "Test1");
		log.write2("Test1", "Test1", 1);
		log.write2("Test1", "Test1", 1, "");
		log.write2("Test1", "Test1", 1, "", [[ "t", 1 ]]);
		logControl.trace = true;
		log.blank(3);
		log.write("test1", 1);
		log.write2("Test1", "Test1", 5);
		log.withColor("Test1", teWrapper.log.colors.blue);
		logControl.trace = trace;
		//
		// Disable logging
		//
		overrideNextShowInfoBox("Cancel");
		await teWrapper.config.updateWs(teWrapper.keys.Config.LogEnable, false);
		log.blank(1);
		log.dequeue("");
		log.value("a", "a");
		log.value("a", "a", 1);
		log.value("a", "a", 1, "   ");
		log.values(1, "", [[ "a", 1 ]]);
		log.values(1, "", [[ "a", 1 ]]);
		log.methodEvent("a", "a");
		log.methodEvent("a", "a", 1);
		log.methodStart("a",  1);
		log.methodDone("a",  1);
		log.write("test");
		log.write2("test2", "sa");
		log.write2("test2", "");
		log.write("Test1", 1);
		log.info("Test1", 1);
		log.withColor("a", log.colors.blue);
		log.write("Test1", 1);
		log.write2("Test1", "Test1", 1);
		log.write2("Test1", "Test1", 1, teWrapper.log.state.lastLogPad, [[ "t", 1 ]]);
		log.info("test");
		log.info("");
		log.withColor("Test1", teWrapper.log.colors.blue);
		//
		// Re-enable logging
		//
		overrideNextShowInfoBox("Cancel");
		await teWrapper.config.updateWs(teWrapper.keys.Config.LogEnable, true);
        endRollingCount(this);
    });


	test("Logging (Uninstall Debug Module)", async function()
    {
        if (exitRollingCount(this)) return;
		this.slow(testControl.slowTime.apiServer.httpGet + (testControl.slowTime.config.event * 2) + 200);
		await teWrapper.config.updateWs(teWrapper.keys.Config.LogEnableModuleReload, true);
		await teWrapper.utils.sleep(100);
		await teWrapper.config.updateWs(teWrapper.keys.Config.LogEnableModuleReload, false);
        endRollingCount(this);
	});

});
