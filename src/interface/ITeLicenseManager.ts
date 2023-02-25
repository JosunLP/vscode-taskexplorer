

import { Task } from "vscode";
import { ISessionToken } from "./IAuthentication";

export interface ITeLicenseManager
{
    checkLicense(logPad?: string): Promise<void>;
    setTasks(tasks: Task[], logPad?: string): Promise<void>;
    enterLicenseKey(): Promise<void>;
    getLicenseKey: () => Thenable<string | undefined>;
    getMaxNumberOfTasks: (taskType?: string | undefined) => number;
    getMaxNumberOfTaskFiles: () => number;
    getVersion: () => string;
    isLicensed: () => boolean;
    setLicenseKey: (licenseKey: string | undefined) => Promise<void>;
    setLicenseToken: (licenseToken: ISessionToken | undefined) => Promise<void>;
}
