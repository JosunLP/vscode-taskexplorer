
import { Globs } from "../constants";
import { TeWrapper } from "../wrapper";
import { registerCommand } from "./command";
import { testPattern } from "../utils/utils";
import { Disposable, Uri, window } from "vscode";


export class EnableTaskTypeCommand implements Disposable
{
    private _disposables: Disposable[] = [];

    constructor(private readonly wrapper: TeWrapper)
    {
        this._disposables.push(
            registerCommand(wrapper.keys.Commands.EnableTaskType, (uri: Uri) => this.enableTaskType(uri), this)
        );
    }

    dispose = () => this._disposables.forEach(d => d.dispose());

    private enableTaskType = async(uri: Uri) =>
    {
        this.wrapper.log.methodStart("enable task type file explorer command", 1, "", true, [[ "path", uri.fsPath ]]);
        const globKey = Object.keys(Globs).find((k => k.startsWith("GLOB_") && testPattern(uri.path, Globs[k])));
        if (globKey)
        {
            const taskType = globKey.replace("GLOB_", "").toLowerCase();
            await this.wrapper.config.update("enabledTasks." + taskType, true);
        }
        else{
            const msg = "This file does not appear to be associated to any known task type";
            this.wrapper.log.write(msg, 1, "");
            window.showInformationMessage(this.wrapper.localize("appstrings.noAssociatedTaskType", msg));
        }
        this.wrapper.log.methodDone("enable task type file explorer command", 1, "");
    };
}
