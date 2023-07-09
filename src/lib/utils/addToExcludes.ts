
import { ILog } from ":types";
import { configuration } from "../configuration";
import { pushIfNotExists, removeFromArray } from "./utils";


export const addToExcludes = async(paths: string[], excludesList: string, log: ILog, logPad: string) =>
{
    const excludes = configuration.get<string[]>(excludesList, []);
    log.methodStart("add to excludes", 2, logPad, false, [[ "paths", paths.join(", ") ]]);
    for (const p of paths) {
        pushIfNotExists(excludes, p);
    }
    await configuration.update(excludesList, excludes);
    log.methodDone("add to excludes", 2, logPad);
};


export const removeFromExcludes = async(paths: string[], excludesList: string, log: ILog, logPad: string) =>
{
    const excludes = configuration.get<string[]>(excludesList, []);
    log.methodStart("remove from excludes", 2, logPad, false, [[ "paths", paths.join(", ") ]]);
    for (const p of paths) {
        removeFromArray(excludes, p);
    }
    await configuration.update(excludesList, excludes);
    log.methodDone("remove from excludes", 2, logPad);
};
