
import { Globs } from "../constants";
import { TeWrapper } from "../wrapper";
import { Disposable, Uri } from "vscode";
import { testPattern } from "../utils/utils";
import { Commands, registerCommand } from "./command";


export class DisableTaskTypeCommand implements Disposable
{
    private _disposables: Disposable[] = [];

    constructor(private readonly wrapper: TeWrapper)
    {
        this._disposables.push(
            registerCommand(Commands.DisableTaskType, (uri: Uri) => this.disableTaskType(uri), this)
        );
    }

    dispose = () => this._disposables.forEach((d) => d.dispose());

    private disableTaskType = async(uri: Uri) =>
    {
        this.wrapper.log.methodStart("disable task type file explorer command", 1, "", true, [[ "path", uri.fsPath ]]);
        const globKey = Object.keys(Globs).find((k => k.startsWith("GLOB_") && testPattern(uri.path, Globs[k]))) as string;
        const taskType = globKey.replace("GLOB_", "").toLowerCase();
        await this.wrapper.config.update("enabledTasks." + taskType, false);
        this.wrapper.log.methodDone("disable task type file explorer command", 1, "");
    };

}
