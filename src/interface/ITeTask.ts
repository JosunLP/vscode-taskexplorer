import { ITaskDefinition } from "./ITaskDefinition";
import { TeTaskListType } from "./TaskChangeEvent";

export interface ITeTask
{
	definition: ITaskDefinition;
	listType:  TeTaskListType;
	name: string;
	pinned: boolean;
	runCount: number;
	running: boolean;
	source: string;
	treeId: string;
}
