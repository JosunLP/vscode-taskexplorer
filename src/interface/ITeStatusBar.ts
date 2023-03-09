
export interface ITeStatusBar
{
	get(): string;
	hide(): void;
	show(): void;
    update(msg: string): void;
}
