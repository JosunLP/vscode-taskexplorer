import { Command } from "vscode";

export interface IStatusBarInfo
{
	text: string;
	toolTip?: string;
	command?: string | Command;
	increment?: number;
}

export interface ITeStatusBar
{
	info: IStatusBarInfo;
	text: string;
	hide(): void;
	runWithProgress<T>(task: (...args: any[]) => Thenable<T>, ...args: any[]): Thenable<T>;
	show(info: IStatusBarInfo): void;
	showTimed(info: IStatusBarInfo, resetInfo?: IStatusBarInfo, delayMs?: number): void;
    update(text: string, incrementOrReset?: number): void;
	updateRunProgress(task: string, project: string, pct: number): number;
}
