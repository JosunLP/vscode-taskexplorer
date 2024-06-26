
import { Globs } from "../constants";
import { TeWrapper } from "../wrapper";
import { Disposable, Uri, window } from "vscode";
import { removeFromExcludes } from "../utils/addToExcludes";
import { executeCommand, registerCommand } from "./command";


export class RemoveFromExcludesCommand implements Disposable
{
    private _disposables: Disposable[] = [];

    constructor(private readonly wrapper: TeWrapper)
    {
        this._disposables.push(
            registerCommand(wrapper.keys.Commands.RemoveFromExcludes, (uri: Uri) => this.removeUriFromExcludes(uri), this)
        );
    }

    dispose = () => this._disposables.forEach(d => d.dispose());

    private removeUriFromExcludes = async(uri: Uri) =>
    {
        this.wrapper.log.methodStart("remove from excludes file explorer command", 1, "", true, [[ "path", uri.fsPath ]]);
        if (!this.wrapper.fs.isDirectory(uri.fsPath))
        {
            const globKey = Object.keys(Globs).find((k => k.startsWith("GLOB_") && this.wrapper.utils.testPattern(uri.path, Globs[k])));
            if (globKey)
            {
                const taskType = globKey.replace("GLOB_", "").toLowerCase();
                this.wrapper.treeManager.configWatcher.enableConfigWatcher(false);
                await removeFromExcludes([ uri.path ], "exclude", this.wrapper.log, "   ");
                this.wrapper.treeManager.configWatcher.enableConfigWatcher(true);
                await executeCommand(this.wrapper.keys.Commands.Refresh, taskType, uri, "   ");
            }
            else{
                const msg = "This file does not appear to be associated to any known task type";
                this.wrapper.log.write(msg, 1, "   ");
                window.showInformationMessage(this.wrapper.localize("appstrings.noAssociatedTaskType", msg));
            }
        }
        else {
            await removeFromExcludes([ uri.path + "/**" ], "exclude", this.wrapper.log, "   ");
        }
        this.wrapper.log.methodDone("remove from excludes file explorer command", 1, "");
    };
}
