import { CancellationToken, Progress } from "vscode";

export interface ITeStatusBar
{
	get(): string;
	runWithProgress<T>(task: () => Thenable<T>): Thenable<T>;
    update(msg: string): void;
}
