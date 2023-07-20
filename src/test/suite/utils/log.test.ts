
import { ITeWrapper, ILog, ILogControl } from ":types";
import { executeSettingsUpdate } from "../../utils/commandUtils";
import { activate, exitRollingCount, endRollingCount, suiteFinished, testControl } from "../../utils/utils";

let log: ILog;
let teWrapper: ITeWrapper;
let logControl: ILogControl;


suite("Logging Tests", () =>
{
	suiteSetup(async function()
    {
        if (exitRollingCount(this, true)) return;
		({ teWrapper } = await activate());
		log = teWrapper.log;
		logControl = teWrapper.logControl;
		await teWrapper.config.updateWs(teWrapper.keys.Config.LogEnable, true);
        endRollingCount(this, true);
	});


	suiteTeardown(async function()
    {
        if (exitRollingCount(this, false, true)) return;
		log.setWriteToConsole?.(logControl.writeToConsole, logControl.writeToConsoleLevel);
		await teWrapper.config.updateWs(teWrapper.keys.Config.LogEnable, logControl.enable);
		await teWrapper.config.updateWs(teWrapper.keys.Config.LogEnableFile, logControl.enableFile);
		await teWrapper.config.updateWs(teWrapper.keys.Config.LogEnableOutputWindow, logControl.enableOutputWindow);
		await teWrapper.config.updateWs(teWrapper.keys.Config.logEnabledModuleReload, logControl.moduleReload);
		await teWrapper.config.updateWs(teWrapper.keys.Config.LogLevel, logControl.level);
        suiteFinished(this);
	});


    test("Logging (Error)", async function()
    {
        if (exitRollingCount(this)) return;
		this.slow((testControl.slowTime.config.event * 5) + 200);

        teWrapper.log.error(`        ${teWrapper.extensionId}`);
        teWrapper.log.error([ `        ${teWrapper.extensionId}`,
                    `        ${teWrapper.extensionId}`,
                    `        ${teWrapper.extensionId}` ]);

		teWrapper.log.error("Test5 error");
		teWrapper.log.error(new Error("Test error object"));
		teWrapper.log.error([ "Test error 1", "Test error 2" ]);
		teWrapper.log.error([ "Test error 3", null, "Test error 4", "" ]);
		teWrapper.log.error([ "Test error 3", "Test error 4" ]);
		teWrapper.log.error([ "Test error 3", "Test error 4" ]);
		teWrapper.log.error([ "Test error 5", "Test error 6" ]);
		teWrapper.log.error([ "Test error 5", "Test error 7" ]);
		teWrapper.log.error("Test error 5");
		teWrapper.log.error([ "", "Test error 5", undefined, "Test error 6", "" ]);
		teWrapper.log.error([ "Test error 7", "", "Test error 8", "" ]);
		teWrapper.log.error([ "Test error 9",  new Error("Test error object 10") ]);
		teWrapper.log.error([ "Test error 11", "Test error 12" ], [[ "Test param error 13", "Test param value 14" ]]);
		teWrapper.log.error("this is a test4", [[ "test6", true ], [ "test6", false ], [ "test7", "1111" ], [ "test8", [ 1, 2, 3 ]]]);
		teWrapper.logControl.isTestsBlockScaryColors = !testControl.log.blockScaryColors;
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
		teWrapper.logControl.isTestsBlockScaryColors = testControl.log.blockScaryColors;
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
		const scaryOff = teWrapper.logControl.isTestsBlockScaryColors;
		teWrapper.logControl.isTestsBlockScaryColors = false;
		teWrapper.log.error("Scary error");
		teWrapper.log.error("error line1\nline2");
		teWrapper.log.error("error line1\r\nline2");
		teWrapper.log.error(new Error("Test error object"));
		teWrapper.logControl.trace = false;
		teWrapper.logControl.isTestsBlockScaryColors = true;
		teWrapper.log.error("Scary error");
		teWrapper.logControl.isTestsBlockScaryColors = scaryOff;
		//
		// Disable logging
		//
		await executeSettingsUpdate(teWrapper.keys.Config.LogEnable, false);
		teWrapper.log.error("Test5 error");
		teWrapper.log.error("Test5 error");
		teWrapper.log.error(new Error("Test error object"));
		teWrapper.log.error([ "Test error 1", "Test error 2" ]);
		teWrapper.log.error([ "Test error 1", undefined, "Test error 2" ]);
		teWrapper.log.error([ "Test error 1",  new Error("Test error object") ]);
		teWrapper.log.error([ "Test error 1", "Test error 2" ], [[ "Test param error", "Test param value" ]]);
		teWrapper.log.error("this is a test4", [[ "test6", true ], [ "test6", false ], [ "test7", "1111" ], [ "test8", [ 1, 2, 3 ]]]);
		const err2 = new Error("Test error object");
		err2.stack = undefined;
		teWrapper.log.error(err2);
		//
		// Re-enable logging
		//
		await executeSettingsUpdate(teWrapper.keys.Config.LogEnable, true);
        endRollingCount(this);
    });


	test("Logging (File)", async function()
    {
        if (exitRollingCount(this)) return;
		this.slow((testControl.slowTime.config.event * 7) + 150);
		await teWrapper.config.updateWs(teWrapper.keys.Config.LogEnable, false);
		await teWrapper.config.updateWs(teWrapper.keys.Config.LogEnableFile, false);
		await teWrapper.config.updateWs(teWrapper.keys.Config.LogEnableFile, true);
		await teWrapper.utils.sleep(25);
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
		// await teWrapper.config.updateWs(teWrapper.keys.Config.logEnabledModuleReload, true);
		// log.write("Test1", 1);
		// log.write2("Test1", "Test1", 1);
		// log.value("Test2", "value", 1);
		// log.error("Test2 error");
		// log.error(new Error("Test error object"));
		// log.error([ "Test error 1", "Test error 2" ]);
		// log.error("Test4 error", [[ "p1", "e1" ]]);
		// await teWrapper.config.updateWs(teWrapper.keys.Config.logEnabledModuleReload, false);
		log.write("Test1", 1);
		log.value("Test2", "value", 1);
		log.error("Error1");
		log.warn("Warning1");
		log.value("Test3", "value3", 1);
		await teWrapper.config.updateWs(teWrapper.keys.Config.LogEnableFile, false);
		//
		// Disable logging
		//
		await teWrapper.config.updateWs(teWrapper.keys.Config.LogEnable, false);
		log.error("Error1");
		log.warn("Warning1");
		log.write2("Test1", "Test1", 1);
		//
		// Re-enable logging
		//
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
		await teWrapper.config.updateWs(teWrapper.keys.Config.LogEnable, false);
		log.methodStart("methodName");
		log.methodDone("methodName");
		log.methodEvent("methodName");
		//
		// Re-enable logging
		//
		await teWrapper.config.updateWs(teWrapper.keys.Config.LogEnable, true);
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
		log.error("error line1\r\nline2", undefined, "queueTestId");
		log.write("line1\r\nline2", 1, "   ", "queueTestId");
		log.error(new Error("Test error object"));
		log.dequeue("queueTestId");

		await teWrapper.config.updateWs(teWrapper.keys.Config.LogEnableFile, true);
		log.write("test1", 1, "", "queueTest2Id", false, false);
		log.error("test4", undefined, "queueTest2Id");
		log.value("test3", "value1", 1, "", "queueTest2Id");
		log.error("test5", [[ "param1", 1 ]], "queueTest2Id");
		log.error("error line1\nline2", undefined, "queueTest2Id");
		log.write("line1\r\nline2", 1, "   ", "queueTest2Id");
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
		log.value("empty string value", "");
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
		log.value("test", "1");
		log.value("test", "1", 1);
		log.value("test", "1", 5);
		//
		// Console Off
		//
		log.setWriteToConsole?.(false);
		//
		// Disable logging
		//
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
		await teWrapper.config.updateWs(teWrapper.keys.Config.LogEnable, true);
        endRollingCount(this);
    });


    test("Logging (Warn)", async function()
    {
        if (exitRollingCount(this)) return;
		this.slow((testControl.slowTime.config.event * 2) + 50);
		log.warn("test1");
		log.warn("test2");
		const scaryOff = logControl.isTestsBlockScaryColors;
		logControl.isTestsBlockScaryColors = false;
		log.warn("test3");
		logControl.isTestsBlockScaryColors = true;
		log.warn("test3");
		logControl.isTestsBlockScaryColors = scaryOff;
		//
		// Disable logging
		//
		await teWrapper.config.updateWs(teWrapper.keys.Config.LogEnable, false);
		log.warn("test1");
		log.warn("test2");
		//
		// Re-enable logging
		//
		await teWrapper.config.updateWs(teWrapper.keys.Config.LogEnable, true);
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
		log.write("test");
		//
		// Console Off
		//
		log.setWriteToConsole?.(false);
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
		log.withColor("Test1", teWrapper.figures.colors.blue);
		logControl.trace = trace;
		//
		// Disable logging
		//
		await teWrapper.config.updateWs(teWrapper.keys.Config.LogEnable, false);
		log.blank(1);
		log.dequeue("");
		log.write("test");
		log.write("Test1", 1);
		log.write("Test1", 1);
		log.write2("Test1", "Test1", 1);
		log.write2("Test1", "Test1", 1, "", [[ "t", 1 ]]);
		log.info("test");
		log.info("");
		log.withColor("Test1", teWrapper.figures.colors.blue);
		//
		// Re-enable logging
		//
		await teWrapper.config.updateWs(teWrapper.keys.Config.LogEnable, true);
        endRollingCount(this);
    });

});
