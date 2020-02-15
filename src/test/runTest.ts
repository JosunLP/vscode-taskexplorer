import * as path from "path";
import { runTests } from "vscode-test";

async function main()
{
    const extensionDevelopmentPath = path.resolve(__dirname, "../../");
    const extensionTestsPath = path.resolve(__dirname, "../../out/test");

    try {
        await runTests({
            version: process.env.CODE_VERSION,
            extensionDevelopmentPath,   // <- vscode-test
            extensionTestsPath,         // <- vscode-test
            // extensionPath: extensionDevelopmentPath,   // <- vscode
            // testRunnerPath: extensionTestsPath,        // <- vscode
            // testWorkspace: extensionDevelopmentPath,   // <- vscode
            launchArgs: [extensionTestsPath]           // <- vscode AND vscode-test
        });
    } catch (err) {
        console.error(`Failed to run tests: ${err}\n${err.stack}`);
        process.exit(1);
    }
}

main();
