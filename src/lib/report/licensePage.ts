
import log from "../log/log";
import { Disposable, Task, WebviewPanel } from "vscode";
import { createTaskCountTable, createWebviewPanel } from "./utils";
import { ITaskExplorerApi } from "../../interface";

let panel: WebviewPanel | undefined;


export const displayLicenseReport = async(api: ITaskExplorerApi, disposables: Disposable[], logPad: string, tasks?: Task[]) =>
{
	log.methodStart("display license report", 1, logPad);
	const html = await getPageContent(api, logPad + "   ", tasks);
	panel = await createWebviewPanel("Task Explorer Licensing", html, disposables);
    log.methodDone("display license report", 1, logPad);
    return panel;
};


const getPageContent = async (api: ITaskExplorerApi, logPad: string, tasks?: Task[]) =>
{
	let html = "";

	if (!tasks)
	{
		const explorer = api.explorer || api.sidebar;
		/* istanbul ignore else */
		if (explorer) {
			tasks = explorer.getTasks();
		}
	}

	if (tasks)
	{
		html = await createTaskCountTable(api, tasks, "Welcome to Task Explorer");

		let infoContent = getExtraContent(logPad + "   ");
		html = html.replace("<!-- addtlContentTop -->", infoContent);

		infoContent = getExtraContent2(logPad + "   ");
		html = html.replace("<!-- addtlContent -->", infoContent);

		const idx1 = html.indexOf("<!-- startViewLicenseButton -->"),
			  idx2 = html.indexOf("<!-- endViewLicenseButton -->") + 29;
		html = html.replace(html.slice(idx1, idx2), "");
	}

	return html;
};


const getExtraContent = (logPad: string) =>
{
    log.methodStart("get body content", 1, logPad);

	const details = `
<table style="margin-top:15px;width:inherit">
	<tr><td style="font-weight:bold;font-size:14px">
		Licensing Note
	</td></tr>
	<tr><td>
		This extension is free to use but am considering a small license for an
		unlimited parsed component type of thing (e.g $10 - $20), as the time spent
		and functionality have went way beyond what was at first intended.
		<br><br>Hey Sencha, you can buy it and replace your own product if you want ;).
	</td></tr>
</table>
<table style="margin-top:20px">
	<tr><td>You can view a detailed parsing report using the "<i>Task Explorer: View Parsing Report</i>"
	command in the Explorer context menu for any project.  It can alternatively be ran from the
	command pallette for "all projects".
	<tr><td height="20"></td></tr>
</table>`;

	log.methodDone("get body content", 1, logPad);

	return `<tr><td>${details}</td></tr>`;
};


const getExtraContent2 = (logPad: string) =>
{
    log.methodStart("get body content", 1, logPad);

	const details = `<tr><td>
<table style="margin-top:15px;width:inherit">
	<tr><td style="font-size:16px;font-weight:bold">Example Parsing Report:</td></tr>
	<tr><td>
		<img src="https://raw.githubusercontent.com/spmeesseman/vscode-taskexplorer/master/res/readme/parsingreport.png">
	</td></tr>
</td></tr>`;

	log.methodDone("get body content", 1, logPad);

	return `<tr><td>${details}</td></tr>`;
};