
import { log } from "../log/log";
import { TextDocument } from "vscode";
import { TeWrapper } from "../wrapper";
import { isWatchTask } from "./taskUtils";
import { TaskItem } from "../../tree/item";
import { IDictionary } from "../../interface";


const jsonMap: IDictionary<{object: string; preKey: string; postKey: string}> = {
    npm: {
        object: "\"scripts\"",
        preKey: "(?<=\\s)\"",
        postKey: "\" *\\:"
    },
    workspace: {
        object: "\"tasks\"",
        preKey: "\"(?:script|label)\" *\\: *\"",
        postKey: "\"(?:\\s|,|$)*"
    }
};


export const findJsonDocumentPosition = (documentText: string, taskName: string, taskSource: string): number =>
{
    log.methodStart("find json document position", 2, "   ", false, [
        [ "task name", taskName ], [ "task type", taskSource ]
    ]);

    const props = jsonMap[taskSource.toLowerCase()],
          blockOffset = documentText.indexOf(props.object),
          regex = new RegExp("(" + props.preKey + taskName + props.postKey + ")", "gm");

    let scriptOffset = blockOffset,
        match: RegExpExecArray | null,
        matches = 0;

    while ((match = regex.exec(documentText.substring(blockOffset))) !== null)
    {
        ++matches;
        scriptOffset = match.index + match[0].indexOf(taskName) + blockOffset;
    }

    log.methodDone("find json document position", 2, "   ", [[ "position", scriptOffset ], [ "# of matches", matches ]]);
    return scriptOffset;
};


export const findDocumentPosition = (wrapper: TeWrapper, document: TextDocument, taskItem: TaskItem): number =>
{
    let scriptOffset = 0;
    const documentText = document.getText();

    log.methodStart("find task definition document position", 1, "", true,
        [[ "task label", taskItem.label ], [ "task source", taskItem.taskSource ]]
    );

    const def = taskItem.task.definition;
    if (taskItem.taskSource === "npm" || taskItem.taskSource === "Workspace") // JSON
    {
        log.write("   find json position", 2);
        scriptOffset = findJsonDocumentPosition(documentText, taskItem.task.name, taskItem.taskSource);
    }
    else if (!isWatchTask(taskItem.taskSource, wrapper))
    {
        log.write("   find custom provider position", 2);
        const provider = wrapper.providers[def.type];
        scriptOffset = provider?.getDocumentPosition(taskItem.task.name, documentText) || -1;
    }

    if (scriptOffset === -1) {
        scriptOffset = 0;
    }

    log.methodDone("find task definition document position", 1, "", [[ "offset", scriptOffset ]]);
    return scriptOffset;
};
