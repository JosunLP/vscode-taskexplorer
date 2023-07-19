/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable import/no-extraneous-dependencies */

import { expect } from "chai";
import { ITeWrapper } from ":types";
import { activate, endRollingCount, exitRollingCount, suiteFinished, testControl as tc } from "../../utils/utils";

let teWrapper: ITeWrapper;


suite("Server Tests", () =>
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


    test("Download Stack Trace Support Files", async function()
    {
        if (exitRollingCount(this)) return;
        this.slow(tc.slowTime.apiServer.httpGet * 2);
        const wasmContent = await teWrapper.server.get("app/shared/mappings.wasm", true, "");
        expect(wasmContent).to.not.be.undefined;
        let srcMapContent = await teWrapper.server.get(`app/vscode-taskexplorer/v${teWrapper.version}/taskexplorer.js.map`, true, "");
        expect(srcMapContent).to.be.a("string");
        srcMapContent = await teWrapper.server.get(`app/vscode-taskexplorer/v${teWrapper.version}/taskexplorer.js.map`, false, "");
        expect(srcMapContent).to.be.an("object").that.haveOwnPropertyDescriptor("version");
        endRollingCount(this);
    });


    test("Simulate HTTP Exception", async function()
    {
        if (exitRollingCount(this)) return;
        let error = teWrapper.server.createError(500, "{ \"message\": \"test message 1\" }", "err msg 1");
        expect(error.status).to.be.a("number").that.equals(500);
        expect(error.success).to.be.a("boolean").that.equals(false);
        expect(error.message).to.be.a("string").that.equals("err msg 1");
        expect(error.timestamp).to.be.a("number").that.is.greaterThan(0);
        expect(error.toString()).to.be.a("string").that.equals("err msg 1");
        let jso = error.toJSON();
        expect(jso).to.be.an("object");
        expect(jso.body).to.be.an("object");
        expect(error.body).to.be.an("object");
        expect(error.body.raw).to.be.a("string");
        expect(error.body.jso).to.be.an("object");
        expect(jso.message).to.be.a("string").that.equals("err msg 1");
        error = teWrapper.server.createError(409, "{ \"message\": \"test message 2\" }", new Error("err msg 2"));
        expect(error.status).to.be.a("number").that.equals(409);
        expect(error.success).to.be.a("boolean").that.equals(false);
        expect(error.message).to.be.a("string").that.equals("err msg 2");
        expect(error.timestamp).to.be.a("number").that.is.greaterThan(0);
        expect(error.toString()).to.be.a("string").that.equals("err msg 2");
        jso = error.toJSON();
        expect(jso).to.be.an("object");
        expect(jso.body).to.be.an("object");
        expect(jso.message).to.be.a("string").that.equals("err msg 2");
        error = teWrapper.server.createError(undefined, undefined);
        error = teWrapper.server.createError(undefined, "body");
        error = teWrapper.server.createError(undefined, "{ \"message\": \"test message 3\" }");
        error.toString();
        endRollingCount(this);
    });

});
