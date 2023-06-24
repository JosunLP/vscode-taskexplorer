/* eslint-disable @typescript-eslint/naming-convention */

import { Event } from "vscode";

export interface TeSessionChangeEvent
{
	account: ITeAccount;
	changeNumber: number;
	changeFlags: {
		expiration: boolean;
		license: boolean;
		licenseState: boolean;
		licenseType: boolean;
		paymentDate: boolean;
		session: boolean;
		trialPeriod: boolean;
		verification: boolean;
	};
	session: {
		added: ITeSession[];
		removed: ITeSession[];
		changed: ITeSession[];
	};
};

export interface ITeSession
{
	readonly token: string;
	readonly scopes: string[];
	readonly expires: number;
	readonly issued: number;
}

export enum TeLicenseType
{
    None = 0,
    Free,
    Trial,
    TrialExtended,
    Standard,
    Pro,
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

export enum TeLicenseState
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
	readonly isBusy: boolean;
    readonly onReady: Event<void>;
    account: ITeAccount;
    isLicensed: boolean;
    isPaid: boolean;
    isRegistered: boolean;
    isTrial: boolean;
	isTrialExtended: boolean;
	onDidSessionChange: Event<TeSessionChangeEvent>;
    checkLicense(logPad: string): Promise<void>;
    getMaxNumberOfTasks: (taskType?: string | undefined) => number;
    getMaxNumberOfTaskFiles: () => number;
	setMaxTasksReached(taskType?: string, force?: boolean): Promise<void>;
	setTestData(data: any): void;
}
