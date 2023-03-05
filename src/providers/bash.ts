
import { Globs } from "../lib/constants";
import { TeWrapper } from "../lib/wrapper";
import { ScriptTaskProvider } from "./script";
import { TaskExplorerProvider } from "./provider";
import { getCombinedGlobPattern } from "../lib/utils/utils";

export class BashTaskProvider extends ScriptTaskProvider implements TaskExplorerProvider
{
    constructor(wrapper: TeWrapper) { super(wrapper, "bash"); }

    public override getGlobPattern()
    {
        return getCombinedGlobPattern(Globs.GLOB_BASH, this.wrapper.config.get<string[]>("globPatternsBash", []));
    }

}
