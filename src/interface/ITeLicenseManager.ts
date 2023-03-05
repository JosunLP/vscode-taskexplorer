/* eslint-disable @typescript-eslint/naming-convention */

import { Task } from "vscode";

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
	type: TeLicenseType;
	paid: boolean;
	readonly id: number;
    readonly key: string;
	readonly issued: number;
	readonly expires: number;
	readonly expired: boolean;
}

export interface ITeAccount
{
	readonly id: number;
	readonly created: number;
	readonly email: string;
	readonly firstName: string;
	readonly lastName: string;
    readonly license: ITeLicense;
	readonly name: string;
	readonly orgId: number;
	readonly trialId: number;
    session: ITeSession;
	verified: boolean;
	verificationPending: boolean;
}

export interface ITeLicenseManager
{
    isLicensed: boolean;
    isRegistered: boolean;
    checkLicense(logPad: string): Promise<void>;
    getMaxNumberOfTasks: (taskType?: string | undefined) => number;
    getMaxNumberOfTaskFiles: () => number;
}
