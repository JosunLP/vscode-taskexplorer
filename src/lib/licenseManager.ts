
import * as https from "http";
//import * as https from "https";
import * as log from "./utils/log";
import { storage } from "./utils/storage";
import { commands, ExtensionContext, InputBoxOptions, Task, ViewColumn, WebviewPanel,  window, workspace } from "vscode";
import { ILicenseManager } from "../interface/licenseManager";
import { getHeaderContent, getBodyContent, isScriptType } from "./utils/utils";


export class LicenseManager implements ILicenseManager
{

	private useFakeLicense = true; // Temp
	private maxFreeTasks = 500;
	private maxFreeTaskFiles = 100;
	private maxFreeTasksForTaskType = 100;
	private maxFreeTasksForScriptType = 50;
	private licensed = false;
	private version: string;
	private numTasks: number | undefined;
	private panel: WebviewPanel | undefined;
	private context: ExtensionContext;


	constructor(context: ExtensionContext)
    {
		this.context = context;
        //
        // Store extension version
		// Note context.extension is only in VSCode 1.55+
        //
        this.version = context.extension.packageJSON.version;
    }


	async checkLicense(logPad = "   ")
	{
		const storedLicenseKey = this.getLicenseKey();
		log.methodStart("Check license", 1, logPad, false, [["stored license key", storedLicenseKey]]);
		if (storedLicenseKey) {
			try {
				this.licensed = await this.validateLicense(storedLicenseKey, logPad + "   ");
			}
			catch{}
		}
		log.methodDone("Check license", 1, logPad, false, [["is valid license", this.licensed]]);
	}


	async setTasks(components: Task[], logPad = "   ")
	{
		let displayInfo = false, displayPopup = false;
		const storedVersion = storage.get<string>("version");

		if (this.numTasks === components.length) {
			return;
		}

		this.numTasks = components.length;

		// if (this.numTasks < this.maxFreeTasks) {
		// 	return;
		// }

		log.methodStart("display info startup page", 1, logPad, false, [
			["stored version", storedVersion], ["is licensed", this.licensed]
		]);

		let content = getHeaderContent();

		content += "<table align=\"center\" width=\"900\">";

		content += ("<tr><td>" + getBodyContent("Welcome to Task Explorer") + "</td></tr>");

		if (this.version !== storedVersion)
		{
			content += ("<tr><td>" + this.getInfoContent(components) + "</td></tr>");
			displayInfo = true;
		}

		if (!this.licensed)
		{
			content += ("<tr><td>" + this.getLicenseContent() + "</td></tr>");
			displayPopup = !displayInfo;
			// displayInfo = true; // temp
		}

		content + "</table>";

		content += this.getFooterContent();

		if (displayInfo)
		{
			this.panel = window.createWebviewPanel(
				"taskExplorer",   // Identifies the type of the webview. Used internally
				"Task Explorer",  // Title of the panel displayed to the users
				ViewColumn.One,   // Editor column to show the new webview panel in.
				{
					enableScripts: true
				}
			);
			this.panel.webview.html = content;
			this.panel.reveal();
			await storage.update("version", this.version);

			this.panel.webview.onDidReceiveMessage
			(
				message =>
				{
					switch (message.command)
					{
						case "enterLicense":
							commands.executeCommand("taskExplorer.enterLicense");
							return;
						case "viewReport":
							commands.executeCommand("taskExplorer.viewReport");
							return;
						default:
							return;
					}
				}, undefined, this.context.subscriptions
			);
		}
		else if (displayPopup)
		{
			const msg = "Purchase a license to unlock unlimited parsed tasks.";
			window.showInformationMessage(msg, "Enter License Key", "Info", "Not Now")
			.then((action) =>
			{
				if (action === "Enter License Key")
				{
					this.enterLicenseKey(); // don't await
				}
				else if (action === "Info")
				{
					commands.executeCommand("taskExplorer.viewReport");
				}
			});
		}

		log.methodDone("display info startup page", 1, logPad);
	}


	async enterLicenseKey()
	{
		const opts: InputBoxOptions = { prompt: "Enter license key" };
		try {
			const input = await window.showInputBox(opts);
			if (input) {
				this.licensed = await this.validateLicense(input);
			}
		}
		catch (e) {}
	}


	// function closeWebView()
	// {
	//     panel?.dispose();
	// }


	getLicenseKey()
	{
		return !this.useFakeLicense ? storage.get<string>("license_key") : "1234-5678-9098-7654321";
	}


	private getFooterContent()
	{
		return "</body></html>";
	}


	private getLicenseContent()
	{
		return `<table style="margin-top:15px;width:inherit">
		<tr><td style="font-weight:bold;font-size:14px">
			Licensing Note
		</td></tr>
		<tr><td>
			This extension is free to use but am considering a small license for an
			unlimited parsed component type of thing (e.g $10 - $20), as the time spent
			and functionality have went way beyond what was at first intended.
			<br><br>Hey Sencha, you can buy it and replace your own product if you want ;).
		</td></tr></table>
		<table style="margin-top:30px">
			<tr><td>You can view a detailed parsing report using the "<i>Task Explorer: View Parsing Report</i>"
			command in the Explorer context menu for any project.  It can alternatively be ran from the
			command pallette for "all projects".
			<tr><td height="20"></td></tr>
			<tr><td>
				<img src="https://raw.githubusercontent.com/spmeesseman/vscode-extjs/master/res/readme/ast-report.png">
			</td></tr>
		</table>`;
	}


	private getInfoContent(tasks: Task[])
	{
		const projects: string[] = [];
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
			Workspace: 0
		};

		tasks.forEach((t) =>
		{
			if (!taskCounts[t.source]) {
				taskCounts[t.source] = 0;
			}
			taskCounts[t.source]++;
		});

		/** istanbul ignore else */
		if (workspace.workspaceFolders)
		{
			for (const wf of workspace.workspaceFolders)
			{
				projects.push(wf.name)
			}
		}

		return `<table style="margin-top:15px;display:flexbox;width:-webkit-fill-available">
		<tr>
		<td>
			<table>
			<tr>
				<td style="font-size:16px;font-weight:bold" nowrap>
					Task Explorer has parsed ${taskCounts.length} components in
					${projects.length} project${ /** istanbul ignore next */ projects.length > 1 ? "s" : ""}.
				</td>
			</tr>
			<tr>
				<td nowrap>
					<ul>
						<li>${tasks.length} Total tasks</li>
						<li>${taskCounts.ant} Ant tasks</li>
						<li>${taskCounts.apppublisher} App-Publisher tasks</li>
						<li>${taskCounts.bash} Bash scripts</li>
						<li>${taskCounts.batch} Batch scripts</li>
						<li>${taskCounts.composer} Composer tasks</li>
						<li>${taskCounts.gradle} Gradle tasks</li>
						<li>${taskCounts.grunt} Grunt tasks</li>
						<li>${taskCounts.gulp} Gulp tasks</li>
						<li>${taskCounts.make} Make tasks</li>
						<li>${taskCounts.maven} Maven tasks</li>
						<li>${taskCounts.npm} NPM tasks</li>
						<li>${taskCounts.nsis} NSIS tasks</li>
						<li>${taskCounts.powershell} Powershell scripts</li>
						<li>${taskCounts.python} Python scripts</li>
						<li>${taskCounts.ruby} Ruby scripts</li>
						<li>${taskCounts.tsc} Typescript tasks</li>
						<li>${taskCounts.Workspace} VSCode tasks</li>
					</ul>
				</td>
			</tr>
			</table>
		</td>
		<td valign="top" align="right" style="padding-left:100px;padding-top:7px;width:-webkit-fill-available">
			<div>
				<button style="cursor:pointer;width:150px" onclick="getLicense();">Get License Now</button>
			</div>
			<div  style="margin-top:10px">
				<button style="cursor:pointer;width:150px" onclick="viewReport();">View Parsing Report</button>
			</div>
		</td></tr>
	</table>`;
	}


	getMaxNumberOfTasks()
	{
		return this.licensed ? Infinity : this.maxFreeTasks;
	}


	getMaxNumberOfTaskFiles()
	{
		return this.licensed ? Infinity : this.maxFreeTaskFiles;
	}


	getMaxNumberOfTasksByType(taskType: string)
	{
		return this.licensed ? Infinity :
			(taskType === "script" || isScriptType(taskType) ? this.maxFreeTasksForScriptType : this.maxFreeTasksForTaskType);
	}


	getVersion()
	{
		return this.version;
	}


	isLicensed()
	{
		return this.licensed;
	}


	async setLicenseKey(licenseKey: string | undefined)
	{
		await storage.update("license_key", licenseKey);
	}


	private async validateLicense(licenseKey: string, logPad = "   ")
	{
		return new Promise<boolean>((resolve) =>
		{
			log.methodStart("validate license", 1, logPad, false, [["license key", licenseKey]]);

			let rspData = "";
			const options = {
				hostname: "localhost",
				port: 1924,
				path: "/api/license/validate/v1",
				method: "POST",
				timeout: 5000,
				headers: {
					"token": "HjkSgsR55WepsaWYtFoNmRMLiTJS4nKOhgXoPIuhd8zL3CVK694UXNw/n9e1GXiG9U5WiAmjGxAoETapHCjB67G0DkDZnXbbzYICr/tfpVc4NKNy1uM3GHuAVXLeKJQLtUMLfxgXYTJFNMU7H/vTaw==",
					"Content-Type": "application/json"
				}
			};

			const _onError = (e: any)  =>
			{
				if (e.message && e.message.includes("ECONNREFUSED")) {
					log.write("   it appears that the license server is down or offline", 1, logPad);
					log.write("      licensed mode will be automatically enabled.");
				}
				else { log.error(e); }
				log.methodDone("validate license", 1, logPad, false, [["licensed", this.licensed]]);
				resolve(true);
			};
			
			log.write("   send validation request", 1, logPad);

			var req = https.request(options, (res) =>
			{
				log.write("   response received", 1, logPad);
				log.value("      status code", res.statusCode, 2, logPad);
				res.on("data", (chunk) => { rspData += chunk; });
				res.on("end", async() =>
				{
					try
					{   const jso = JSON.parse(rspData);
						const licensed = res.statusCode === 200 && jso.success && jso.message === "Success";
						log.value("      success", jso.success, 3, logPad);
						log.value("      message", jso.message, 3, logPad);
						/** istanbul ignore else */
						if (licensed) {
							await this.setLicenseKey(licenseKey);
						}
						log.methodDone("validate license", 1, logPad, false, [["is valid license", licensed]]);
						resolve(licensed);
					}
					catch (e) { _onError(e); }
				});
			});

			req.on("error", (e) => { _onError(e); });

			req.write(JSON.stringify({
				licensekey: "1234-5678-9098-7654321"
			}));

			req.end();
		});
	}

}
