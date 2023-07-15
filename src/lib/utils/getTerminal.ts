/**
 * @module getTerminal
 *
 * A despised export put together from various user inputs that I can't for the life of me cover
 */

import { basename } from "path";
import { window, Terminal } from "vscode";
import { TaskItem } from "../../tree/node/item";


export const getTerminal = (taskItem: TaskItem): Terminal | undefined =>
{
    let term: Terminal | undefined;

    if (!window.terminals || window.terminals.length === 0)
    {
        return term;
    }

    // if (window.terminals.length === 1)
    // {
    //     log.write("   return only terminal alive", 2, logPad);
    //     return window.terminals[0];
    // }

    const check = (taskName: string) =>
    {
        let term2: Terminal | undefined;
        taskName = taskName.toLowerCase();
        for (const t of window.terminals)
        {
            let termName = t.name.toLowerCase().replace("task - ", "");
            /* istanbul ignore if */
            if (termName.endsWith(" Task")) {
                termName = termName.substring(0, termName.length - 5);
            }
            /* istanbul ignore else */
            if (taskName.indexOf(termName) !== -1 || /* istanbul ignore next */ termName.indexOf(taskName) !== -1)
            {
                term2 = t;
                break;
            }
        }
        return term2;
    };

    let relPath = taskItem.task.definition.path ? /* istanbul ignore next */ taskItem.task.definition.path : "";
    /* istanbul ignore if */
    if (relPath[relPath.length - 1] === "/" || relPath[relPath.length - 1] === "\\")
    {
        relPath = relPath.substring(0, relPath.length - 1);
    }

    /* istanbul ignore next */
    if (taskItem.taskFile.folder.workspaceFolder)
    {
        const lblString = taskItem.task.name;
        let taskName = taskItem.taskFile.label + ": " + taskItem.label +
                        " (" + taskItem.taskFile.folder.workspaceFolder.name + ")";
        term = check(taskName);

        if (!term && lblString.indexOf("(") !== -1)
        {
            taskName = taskItem.taskSource + ": " + lblString.substring(0, lblString.indexOf("(")).trim() +
                       (relPath ? " - " : "") + taskItem.taskFile.folder.workspaceFolder.name + ")";
            term = check(taskName);
        }

        if (!term)
        {
            taskName = taskItem.taskSource + ": " + lblString +
                       (relPath ? " - " : "") + relPath + " (" + taskItem.taskFile.folder.workspaceFolder.name + ")";
            term = check(taskName);
        }

        if (!term)
        {
            taskName = taskItem.taskSource + ": " + lblString + " (" + taskItem.taskFile.folder.workspaceFolder.name + ")";
            term = check(taskName);
        }

        if (!term)
        {
            taskName = taskItem.taskSource + ": " + lblString +
                       (relPath ? " - " : "") + relPath + " (" + taskItem.taskFile.folder.workspaceFolder.name + ")";
            term = check(taskName);
        }

        if (!term && taskItem.taskSource === "Workspace")
        {
            taskName = "npm: " + lblString +
                       (relPath ? " - " : "") + relPath + " (" + taskItem.taskFile.folder.workspaceFolder.name + ")";
            term = check(taskName);
        }

        if (!term && lblString.indexOf("(") !== -1)
        {
            taskName = taskItem.taskSource + ": " + lblString.substring(0, lblString.indexOf("(")).trim() +
                       (relPath ? " - " : "") + relPath + " (" + taskItem.taskFile.folder.workspaceFolder.name + ")";
            term = check(taskName);
        }

        if (!term && lblString.indexOf("(") !== -1)
        {
            taskName = taskItem.taskSource + ": " + lblString.substring(0, lblString.indexOf("(")).trim() +
                       (relPath ? " - " : "") + relPath + " (" + taskItem.taskFile.folder.workspaceFolder.name + ")";
            term = check(taskName);
        }

        if (!term && relPath)
        {
            const folder = taskItem.getFolder();
            if (folder) {
                taskName = folder.name + " (" + relPath + ")";
                term = check(taskName);
            }
            if (!term)
            {
                const folder = taskItem.getFolder();
                if (folder) {
                    taskName = folder.name + " (" + basename(relPath) + ")";
                    term = check(taskName);
                }
            }
        }
    }

    return term;
};
