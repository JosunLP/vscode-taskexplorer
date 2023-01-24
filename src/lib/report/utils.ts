import { join } from "path";
import { getTaskFiles } from "../fileCache";
import { readFileAsync } from "../utils/fs";
import { ITaskExplorerApi } from "../../interface";
import { getInstallPath } from "../utils/pathUtils";
import { commands, Disposable, Task, ViewColumn, window, workspace } from "vscode";
import { getPackageManager, getTaskTypes, lowerCaseFirstChar } from "../utils/utils";


export const createTaskCountTable = async (api: ITaskExplorerApi, tasks: Task[], title: string, project?: string) =>
{
    const projects: string[] = [];
    const installPath = await getInstallPath();
    let fileCount = 0;
    let html = await readFileAsync(join(installPath, "res/license-manager.html"));

    html = html.replace("<!-- title -->", title);

    const taskCounts: any = {
        ant: 0,
        apppublisher: 0,
        bash: 0,
        batch: 0,
        composer: 0,
        gradle: 0,
        grunt: 0,
        gulp: 0,
        make: 0,
        maven: 0,
        npm: 0,
        nsis: 0,
        powershell: 0,
        python: 0,
        ruby: 0,
        tsc: 0,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Workspace: 0
    };

    tasks.forEach((t) =>
    {
        if (!taskCounts[t.source]) {
            taskCounts[t.source] = 0;
        }
        taskCounts[t.source]++;
    });

    if (!project)
    {
        /* istanbul ignore else */
        if (workspace.workspaceFolders)
        {
            for (const wf of workspace.workspaceFolders)
            {
                projects.push(wf.name);
            }
        }
        // eslint-disable-next-line no-template-curly-in-string
        html = html.replace("${projects.length}", projects.length.toString());
    }
    else {
        projects.push(project);
        // eslint-disable-next-line no-template-curly-in-string
        html = html.replace("${projects.length} project(s)", "the " + project + " project");
    }

    getTaskTypes().forEach((tcKey) =>
    {
        const taskFiles = getTaskFiles(tcKey) || [];
        fileCount += taskFiles.length;
        html = html.replace(`\${taskCounts.${tcKey}}`, taskCounts[tcKey] || "0");
    });

    if (getPackageManager() === "yarn") {
        html = html.replace(/\$\{taskCounts.yarn\}/g, taskCounts.npm || "0");
    }
    else {
        html = html.replace(/\$\{taskCounts.yarn\}/g, "0");
    }

    html = html.replace(/\$\{taskCounts\.length\}/g, tasks.length.toString());
    html = html.replace(/\$\{taskTypes.length\}/g, Object.keys(taskCounts).length.toString());
    html = html.replace(/\$\{taskFiles.length\}/g, fileCount.toString());

    if (api.isLicensed())
    {
        const idx1 = html.indexOf("<!-- startEnterLicenseButton -->"),
              idx2 = html.indexOf("<!-- endEnterLicenseButton -->") + 30;
        html = html.replace(html.slice(idx1, idx2), "");
    }

    return html;
};


export const createWebviewPanel = async(title: string, html: string, disposables: Disposable[]) =>
{
    const panel = window.createWebviewPanel(
		lowerCaseFirstChar(title, true), // Identifies the type of the webview. Used internally
		title,                           // Title of the panel displayed to the users
		ViewColumn.One,                  // Editor column to show the new webview panel in.
		{ enableScripts: true }
	);
	panel.webview.html = html;
	panel.webview.onDidReceiveMessage
	(
		message => {
            // don't await?
			commands.executeCommand("taskExplorer." + message.command);
		},
        undefined,
        disposables
	);
	panel.reveal();
    disposables.push(panel);
    return panel;
};
