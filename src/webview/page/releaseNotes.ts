
import { marked } from "marked";
import { State } from "../common/ipc";
import { Uri, workspace } from "vscode";
import { WebviewIds } from "../../interface";
import { TeWrapper } from "../../lib/wrapper";
import { TeWebviewPanel } from "../webviewPanel";


export class ReleaseNotesPage extends TeWebviewPanel<State>
{
	static viewId: WebviewIds = "releaseNotes";


	constructor(wrapper: TeWrapper)
	{
		super(
			wrapper,
			"release-notes.html",
			`${wrapper.extensionName} ${wrapper.context.extension.packageJSON.version} Release Notes`,
			ReleaseNotesPage.viewId,
			"res/img/logo-bl.png",
			wrapper.keys.Commands.ShowReleaseNotesPage
		);
		this._ignoreTeBusy = true;
	}


	protected override includeBootstrap = (): State => this.getState();


	protected override includeFontAwesome = () => (
		{ regular: true, icons: [ "star", "bug", "gear", "asterisk", "chevron-circle-up", "chevron-circle-down" ] }
	);


	private getNewInThisReleaseShortDsc = (): string => "MAJOR RELEASE - A PLETHORA OF NEW FEATURES, BUG FIXES AzND PERFORMANCE ENHANCEMENTS !!";


	private getNewReleaseNotes = (version: string, changeLogMd: string): string =>
	{
	return `
	<table style="margin-top:15px" width="100%">
		${this.getNewReleaseNotesHdr("Features", "star")}
		<tr>
			<td colspan="2">
				${this.getReleaseNotes("Features", version, "feature", changeLogMd)}
			</td>
		</tr>
		${this.getNewReleaseNotesHdr("Bug Fixes", "bug")}
		<tr>
			<td colspan="2">
				${this.getReleaseNotes("Bug Fixes", version, "bug fix", changeLogMd)}
			</td>
		</tr>
		${this.getNewReleaseNotesHdr("Refactoring", "gear")}
		<tr>
			<td colspan="2">
				${this.getReleaseNotes("Refactoring", version, "refactoring", changeLogMd)}
			</td>
		</tr>
		${this.getNewReleaseNotesHdr("Miscellaneous", "asterisk")}
		<tr>
			<td colspan="2">
				${this.getReleaseNotes("Miscellaneous", version, "miscellaneous", changeLogMd)}
			</td>
		</tr>
	</table>`;
	};


	private getNewReleaseNotesHdr = (title: string, icon: string): string =>
	{
		return `
		<tr><td width="100%" colspan="2">
			<hr>
		</td></tr>
		<tr class="content-section-header">
			<td>
				<span class="te-release-notes-section-header-icon">&nbsp;<span class=\"far fa-${icon} content-section-fa-img\"></span></span>
				<span class="te-release-notes-section-header-title">&nbsp;${title}</span>
			</td>
		</tr>
		<tr><td width="100%" colspan="2">
			<hr>
		</td></tr>`;
	};


	private getReleaseNotes = (section: string, version: string, noChangesDsc: string, changeLogMd: string): string =>
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


	protected override onHtmlFinalize = async(html: string): Promise<string> =>
	{
		const changelogPath = Uri.joinPath(this.wrapper.context.extensionUri, "CHANGELOG.md").fsPath,
			  changeLogMd = await this.wrapper.fs.readFileAsync(changelogPath),
			  changeLogHtml = await marked(changeLogMd, { async: true }),
			  version = this.wrapper.context.extension.packageJSON.version;
		html = html.replace("#{changelog}", changeLogHtml)
				   .replace("#{subtitle}", this.getNewInThisReleaseShortDsc())
				   .replace("#{releasenotes}", this.getNewReleaseNotes(version, changeLogMd));
		return html;
	};

}
