#!/usr/bin/env node
/* eslint-disable @typescript-eslint/naming-convention */

const { promisify } = require("util");
const { resolve } = require("path");
const exec = promisify(require("child_process").exec);

//
// Run from script directtory so we work regardless of where cwd is set
//
if (process.cwd() !== __dirname) { process.chdir(__dirname); }


//
// Command line runtime wrapper
//
const cliWrap = exe => argv => { exe(argv).catch(e => { try { console.error(e); } catch {} process.exit(1); }); };

/**
 * @function Executes a command via a promisified node exec()
 * @private
 * @param {string} command
 * @returns {Promise<number | null>}
 */
const wrapExec = async (command) =>
{
    let exitCode = null,
        stdout = "", stderr = "";
    const program = command.split(" ")[0],
          procPromise = exec(command, { encoding: "utf8" }),
          child = procPromise.child;
    child.stdout?.on("data", (data) => { stdout += data; });
    child.stderr?.on("data", (data) => { stderr += data; });
    child.on("close", (code) =>
    {
        exitCode = code;
        console.log(`   ${program} completed with exit code ${code}`);
    });
    await procPromise;
    if (stdout || stderr)
    {
        const match = (stdout || stderr).match(/error TS([0-9]{4})\:/);
        if (match) {
            const [ _, err ] = match;
            logger.error(`   tsc failed with error: ${err}`);
        }
        if (stdout) {
            console.log(`  ${program}  stderr: ${stdout}`);
        }
        if (stderr) {
            console.log(`   ${program} stderr: ${stderr}`);
        }
    }
    return exitCode;
};


cliWrap(async () =>
{
    const host = process.env.WPBUILD_APP1_SSH_UPLOAD_HOST,
          user = process.env.WPBUILD_APP1_SSH_UPLOAD_USER,
          rBasePath = process.env.WPBUILD_APP1_SSH_UPLOAD_PATH,
          sshAuth = process.env.WPBUILD_APP1_SSH_UPLOAD_AUTH,
          sshAuthFlag = process.env.WPBUILD_APP1_SSH_UPLOAD_FLAG,
          toUploadPath = resolve("..", "webpack", "types", ".wpbuildrc.schema.json"),
          version = require("../webpack/package.json").version;

    if (!host || !user || !rBasePath ||  !sshAuth || !sshAuthFlag)
    {
        console.error("Required environment variables for upload are not set");
        return;
    }

    const plinkCmds = [
        `mkdir ${rBasePath}/wpbuild`,
        `mkdir ${rBasePath}/wpbuild/v${version}`,
        `rm -f ${rBasePath}/wpbuild/v${version}/.wpbuildrc.schema.json"`,
    ];

    const plinkArgs = [
        "-ssh",       // force use of ssh protocol
        "-batch",     // disable all interactive prompts
        sshAuthFlag,  // auth flag
        sshAuth,      // auth key
        `${user}@${host}`,
        plinkCmds.join(";")
    ];

    const pscpArgs = [
        sshAuthFlag,  // auth flag
        sshAuth,      // auth key
        "-q",         // quiet, don't show statistics
        toUploadPath, // directory containing the files to upload, the "directpory" itself (prod/dev/test) will be
        `${user}@${host}:"${rBasePath}/wpbuild/v${version}/.wpbuildrc.schema.json"` // uploaded, and created if not exists
    ];

    console.log(`upload rc schema to ${host}`);
    try
    {
        console.log("   plink: create / clear remmote directory");
        // console.log("  plink ${plinkArgs.map((v, i) => (i !== 3 ? v : "<PWD>")).join(" ")}`, 5, "", logIcon);
        await wrapExec("plink " + plinkArgs.join(" "));
        console.log("   pscp:  upload files");
        // console.log("  pscp ${pscpArgs.map((v, i) => (i !== 1 ? v : "<PWD>")).join(" ")}`, 5, "", logIcon);
        await wrapExec("pscp " + pscpArgs.join(" "));
        console.log("successfully uploaded rc schema");
    }
    catch (e)
    {
        console.error(e);
    }
})();
