/* eslint-disable @typescript-eslint/naming-convention */

export interface TeSessionChangeEvent
{
    added: ITeSession[];
    removed: ITeSession[];
    changed: ITeSession[];
};

export interface ITeSession
{
	readonly token: string;
	readonly scopes: string[];
	readonly expires: number;
	readonly issued: number;
}

export const enum TeLicenseType
{
    None = 0,
    Free,
    Trial,
    TrialExtended,
    Standard,
    Enterprise
}

export interface ITeLicense
{
	paid: boolean;
	state: TeLicenseState;
	type: TeLicenseType;
	readonly id: number;
    readonly key: string;
	readonly issued: number;
	readonly expires: number;
	readonly expired: boolean;
	readonly period: 0 | 1 | 2; // 2 indicates that extended trial was already requested/used
}

export const enum TeLicenseState
{
	Trial =  0,
	Free = 1,
	Paid = 2
}

export interface ITeAccount
{
	readonly id: number;
	readonly created: number;
	readonly email: string;
	readonly firstName: string;
	readonly lastName: string;
	readonly name: string;
	readonly orgId: number;
	readonly trialId: number;
	errorState?: boolean;
    license: ITeLicense;
    session: ITeSession;
	verified: boolean;
	verificationPending: boolean;
}

export interface ITeLicenseManager
{
    isLicensed: boolean;
    isRegistered: boolean;
    checkLicense(statusMessage?: string, logPad?: string): Promise<void>;
	getAccount(): Thenable<ITeAccount>;
    getMaxNumberOfTasks: (taskType?: string | undefined) => number;
    getMaxNumberOfTaskFiles: () => number;
	setTestData(data: any): void;
}
