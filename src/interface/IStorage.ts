/* eslint-disable @typescript-eslint/naming-convention */

import { Event, SecretStorageChangeEvent } from "vscode";


export enum StorageKeys
{
    Account = "taskexplorer.account",
    CacheBuster = "taskexplorer.cacheBuster",
    FileCacheProjectFilesMap = "fileCacheProjectFilesMap",
    FileCacheProjectFileToFileCountMap = "fileCacheProjectFileToFileCountMap",
    FileCacheTaskFilesMap = "fileCacheTaskFilesMap",
    LastLicenseNag = "taskexplorer.lastLicenseNag",
    SpecialFolderRenames = "taskexplorer.specialFolder.renames",
	TaskUsage = "taskexplorer.taskUsage",
	Usage = "taskexplorer.usage",
    Version = "taskexplorer.version"
};

export interface IStorageChangeEvent
{
    readonly key: string;
    readonly value: any;
    readonly workspace: boolean;
};

export interface ISecretStorageChangeEvent extends SecretStorageChangeEvent
{
    value: any;
}

export enum StorageTarget
{
    Global = 0,
    Workspace = 1
}

export interface IStorage // extends Memento
{
    onDidChange: Event<IStorageChangeEvent>;
    onDidChangeSecret: Event<ISecretStorageChangeEvent>;
    delete(key: string, storageTarget?: StorageTarget): Thenable<void>;
    deleteSecret(key: string): Thenable<void>;
    get<T>(key: string): T | undefined;
    get<T>(key: string, defaultValue?: T, storageTarget?: StorageTarget): T;
    getSecret<T>(key: string): Thenable<T | undefined>;
    getSecret<T>(key: string, defaultValue?: T): Thenable<T>;
    update(key: string, value: any, storageTarget?: StorageTarget): Thenable<void>;
    updateSecret(key: string, value: string | undefined): Promise<void>;
    keys(): readonly string[];
    get2<T>(key: string): Promise<T | undefined>;
    get2<T>(key: string, defaultValue?: T): Promise<T>;
    get2Sync<T>(key: string): T | undefined;
    get2Sync<T>(key: string, defaultValue?: T): T;
    update2(key: string, value: any): Promise<void>;
    update2Sync(key: string, value: any): void;
}
