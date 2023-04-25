
export interface IStatusBar
{
	hide(reset?: boolean): void;
	runWithProgress<T>(task: () => Thenable<T>): Thenable<T>;
	show(text?: string, toolTip?: string, command?: string): void;
    update(text: string): Promise<void>;
}
