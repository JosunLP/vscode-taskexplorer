
import { Globs } from "../../constants";
import { TeWrapper } from "../../wrapper";
import { ScriptTaskProvider } from "./script";
import { TaskExplorerProvider } from "./provider";
import { getCombinedGlobPattern } from "../../utils/utils";

export class BashTaskProvider extends ScriptTaskProvider implements TaskExplorerProvider
{
    constructor(wrapper: TeWrapper) { super(wrapper, "bash"); }

    public override getGlobPattern()
    {
        return getCombinedGlobPattern(Globs.GLOB_BASH, this.wrapper.config.get<string[]>("globPatternsBash", []));
    }

}
