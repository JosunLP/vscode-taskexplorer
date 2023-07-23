
import { TextDocument } from "vscode";
import { TeWrapper } from "../wrapper";
import { isWatchTask } from "./taskUtils";
import { TaskItem } from "../../tree/node/item";


const jsonMap: Record<string, {object: string; preKey: string; postKey: string}> = {
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
    return scriptOffset;
};


export const findDocumentPosition = (wrapper: TeWrapper, document: TextDocument, taskItem: TaskItem, logPad: string): number =>
{
    let scriptOffset = 0;
    const documentText = document.getText();
    const def = taskItem.task.definition;
    if (taskItem.taskSource === "npm" || taskItem.taskSource === "Workspace") // JSON
    {
        scriptOffset = findJsonDocumentPosition(documentText, taskItem.task.name, taskItem.taskSource);
    }
    else if (!isWatchTask(taskItem.taskSource, wrapper))
    {
        const provider = wrapper.providers[def.type];
        scriptOffset = provider?.getDocumentPosition(taskItem.task.name, documentText) || -1;
    }
    if (scriptOffset === -1) {
        scriptOffset = 0;
    }
    return scriptOffset;
};
