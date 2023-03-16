/* eslint-disable @typescript-eslint/naming-convention */

import { Event, SecretStorageChangeEvent } from "vscode";


export interface StorageChangeEvent
{
    readonly key: string;
    readonly workspace: boolean;
};

export enum StorageTarget
{
    Global = 0,
    Workspace = 1
}

export interface IStorage // extends Memento
{
    onDidChange: Event<StorageChangeEvent>;
    onDidChangeSecret: Event<SecretStorageChangeEvent>;
    delete(key: string, storageTarget?: StorageTarget): Thenable<void>;
    deleteSecret(key: string): Thenable<void>;
    get<T>(key: string): T | undefined;
    get<T>(key: string, defaultValue?: T, storageTarget?: StorageTarget): T;
    getSecret<T>(key: string): Thenable<T | undefined>;
    getSecret<T>(key: string, defaultValue?: T): Thenable<T>;
    update(key: string, value: any, storageTarget?: StorageTarget): Thenable<void>;
    updateSecret(key: string, value: string | undefined): Thenable<void>;
    keys(): readonly string[];
    get2<T>(key: string): Promise<T | undefined>;
    get2<T>(key: string, defaultValue?: T): Promise<T>;
    get2Sync<T>(key: string): T | undefined;
    get2Sync<T>(key: string, defaultValue?: T): T;
    update2(key: string, value: any): Promise<void>;
    update2Sync(key: string, value: any): void;
}
