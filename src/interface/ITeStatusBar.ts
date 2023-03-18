import { CancellationToken, Progress } from "vscode";

export interface ITeStatusBar
{
	get(): string;
	hide(): void;
	runWithProgress<T>(task: () => Thenable<T>): Thenable<T>;
	show(): void;
    update(msg: string): void;
}
