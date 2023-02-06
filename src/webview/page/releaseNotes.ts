
import log from "../../lib/log/log";
import { TeWebviewPanel } from "../webviewPanel";
import { join } from "path";
import { marked } from "marked";
import { WebviewPanel } from "vscode";
import { timeout } from "../../lib/utils/utils";
import { TeContainer } from "../../lib/container";
import { readFileAsync } from "../../lib/utils/fs";
import { getInstallPath } from "../../lib/utils/pathUtils";
import { getExtensionContext, isExtensionBusy } from "../../extension";

const viewTitle = "Task Explorer Release Notes";
const viewType = "viewReleaseNotes";
let panel: TeWebviewPanel<Record<string, unknown>> | undefined;


export const displayReleaseNotes = async(logPad: string) =>
{
	log.methodStart("display release notes", 1, logPad);
	const html = await getPageContent(logPad + "   ");
	panel = TeContainer.instance.webviewManager.create(viewTitle, viewType, html);
    log.methodDone("display release notes", 1, logPad);
    return panel;
};


const getPageContent = async (logPad: string) =>
{
	log.methodStart("get page content", 1, logPad);
	const installPath = await getInstallPath(),
	      releaseNotesHtml = await readFileAsync(join(installPath, "res", "page", "release-notes.html")),
	      changeLogMd = await readFileAsync(join(installPath, "CHANGELOG.md")),
		  changeLogHtml = await marked(changeLogMd, { async: true }),
		  version = getExtensionContext().extension.packageJSON.version;
	let html = releaseNotesHtml.replace("<!-- changelog -->", changeLogHtml)
							   .replace("<!-- title -->", `Task Explorer ${version} Release Notes`)
							   .replace("<!-- subtitle -->", getNewInThisReleaseShortDsc())
							   .replace("<!-- releasenotes -->", getNewReleaseNotes(version, changeLogMd));
	html = TeContainer.instance.webviewManager.cleanLicenseButtons(html);
	log.methodDone("get page content", 1, logPad);
	return html;
};


const getNewInThisReleaseShortDsc = () => "MAJOR RELEASE - A PLETHORA OF NEW FEATURES, BUG FIXES AND PERFORMANCE ENHANCEMENTS !!";


const getNewReleaseNotes = (version: string, changeLogMd: string) =>
{
return `
<table style="margin-top:15px" width="100%">
	${getNewReleaseNotesHdr("Features", "plus")}
	<tr>
		<td>
			${getReleaseNotes("Features", version, "feature", changeLogMd)}
		</td>
	</tr>
	${getNewReleaseNotesHdr("Bug Fixes", "bug")}
	<tr>
		<td>
			${getReleaseNotes("Bug Fixes", version, "bug fix", changeLogMd)}
		</td>
	</tr>
	${getNewReleaseNotesHdr("Refactoring", "cog")}
	<tr>
		<td>
			${getReleaseNotes("Refactoring", version, "refactoring", changeLogMd)}
		</td>
	</tr>
	${getNewReleaseNotesHdr("Miscellaneous", "asterisk")}
	<tr>
		<td>
			${getReleaseNotes("Miscellaneous", version, "miscellaneous", changeLogMd)}
		</td>
	</tr>
</table>`;
};


const getNewReleaseNotesHdr = (title: string, icon: string) =>
{
	return `
	<tr><td width="100%">
		<hr>
	</td></tr>
	<tr class="content-section-header">
		<td class="content-section-header-nowrap" nowrap>&nbsp;<span class=\"far fa-${icon} content-section-fa-img\"></span> &nbsp;${title}</td>
	</tr>
	<tr><td width="100%">
		<hr>
	</td></tr>`;
};


const getReleaseNotes = (section: string, version: string, noChangesDsc: string, changeLogMd: string) =>
{
	let html = "<ul>";
	let match: RegExpExecArray | null;
	const regex = new RegExp(`(?:^## Version ${version.replace(/\./g, "\\.")} (?:\\[([0-9a-zA-Z\\-\\.]{3,})\\])*\\s*\\([a-zA-Z0-9 ,:\\/\\.]+\\)[\\r\\n]+)([^]*?)(?=^## Version|###END###)`, "gm");
	if ((match = regex.exec(changeLogMd + "###END###")) !== null)
	{
		const notes = match[0];
		let match2: RegExpExecArray | null;
		const regex2 = new RegExp(`(?:^### ${section}\\s+)([^]*?)(?=^###? |###END###)`, "gm");
		if ((match2 = regex2.exec(notes + "###END###")) !== null)
		{
			const sectionNotes = match2[0];
			let match3: RegExpExecArray | null;
			const regex3 = new RegExp("\\- ([^]*?)(?=^\\- |###END###)", "gm");
			while ((match3 = regex3.exec(sectionNotes + "###END###")) !== null)
			{
				const note = match3[1];
				html += `<li>${note}</li>`;
			}
		}
		else {
			html += `<li>there are no new ${noChangesDsc} changes in this release</li>`;
		}
	}
	else {
		html += "<li>error - the release notes for this version cannot be found</li>";
	}
	html += "</ul>";
	return html;
};


export const getViewTitle = () => viewTitle;


export const getViewType = () => viewType;


export const reviveReleaseNotes = async(webviewPanel: WebviewPanel, logPad: string) =>
{   //
	// Use a timeout so license manager can initialize first
	//
	await new Promise<void>(async(resolve) =>
	{
		while (isExtensionBusy()) {
			await timeout(100);
		}
		setTimeout(async (webviewPanel: WebviewPanel, logPad: string) =>
		{
			log.methodStart("revive release notes", 1, logPad);
			const html = await getPageContent(logPad + "   ");
			TeContainer.instance.webviewManager.create(viewTitle, viewType, html, webviewPanel);
			log.methodDone("revive release notes", 1, logPad);
			resolve();
		}, 10, webviewPanel, logPad);
	});
};