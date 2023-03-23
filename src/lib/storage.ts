/* eslint-disable @typescript-eslint/naming-convention */

import { join } from "path";
import { isNumber, isString } from "./utils/typeUtils";
import { IDictionary, IStorage, StorageChangeEvent, StorageTarget } from "../interface";
import { createDir, pathExists, readJsonAsync, readJsonSync, writeFile, writeFileSync } from "./utils/fs";
import { Memento, ExtensionContext, SecretStorage, ExtensionMode, SecretStorageChangeEvent, EventEmitter, Event } from "vscode";

export let storage: IStorage;


export const initStorage = async (context: ExtensionContext) =>
{
    const storageFile = join(context.globalStorageUri.fsPath, "storage.json");
    await createDir(context.globalStorageUri.fsPath);
    /* istanbul ignore if */
    if (!(await pathExists(storageFile))) {
        await writeFile(storageFile, "{}");
    }
    storage = new Storage(context, storageFile);
};


class Storage implements IStorage
{
    private isDev: boolean;
    private isTests: boolean;
    private storage: Memento[];
    private storageWs: Memento;
    private storageGbl: Memento;
    private storageFile: string;
    private secrets: SecretStorage;
    private _onDidChange = new EventEmitter<StorageChangeEvent>();
	private _onDidChangeSecret = new EventEmitter<SecretStorageChangeEvent>();


    constructor(context: ExtensionContext, storageFile: string)
    {
        this.storageGbl = context.globalState;
        this.storageWs = context.workspaceState;
        this.storage = [
            this.storageGbl,
            this.storageWs
        ];
        this.secrets = context.secrets;
        this.isDev = context.extensionMode === ExtensionMode.Development;
        this.isTests = context.extensionMode === ExtensionMode.Test;
        this.storageFile = storageFile;
        context.subscriptions.push(
            this._onDidChange,
            this._onDidChangeSecret,
            context.secrets.onDidChange(e => this._onDidChangeSecret.fire(e), this)
        );
    }


	get onDidChange(): Event<StorageChangeEvent> {
		return this._onDidChange.event;
	}

	get onDidChangeSecret(): Event<SecretStorageChangeEvent> {
		return this._onDidChangeSecret.event;
	}


    delete = async(key: string, storageTarget: StorageTarget = StorageTarget.Global) =>
    {
        await this.storage[storageTarget].update(this.getKey(key), undefined);
        this._onDidChange.fire({ key, workspace: false });
    };


    deleteSecret = (key: string) => this.secrets.delete(this.getKey(key));


    keys(): readonly string[]
    {
        const keys = [
            ...Object.keys((this.storage[StorageTarget.Global] as any)._value),
            ...Object.keys((this.storage[StorageTarget.Workspace] as any)._value).filter(k => !this.storage[StorageTarget.Global].get(k))
        ];
        return keys.filter((key) => this.storage[StorageTarget.Global].get(key) !== undefined);
    }


    private getKey = (key: string) => (!this.isDev && !this.isTests ? /* istanbul ignore next */"" :
                                      (this.isDev ? /* istanbul ignore next */"dev" : "tests")) + key;


    private _get2<T>(key: string, store: IDictionary<T>, defaultValue?: T): T | undefined
    {
        if (defaultValue || (isString(defaultValue) && defaultValue === "") || (isNumber(defaultValue) && defaultValue === 0))
        {
            return store[this.getKey(key)] || defaultValue;
        }
        return store[this.getKey(key)];
    }


    get<T>(key: string, defaultValue?: T, storageTarget: StorageTarget = StorageTarget.Global): T | undefined
    {
        if (defaultValue || (isString(defaultValue) && defaultValue === "") || (isNumber(defaultValue) && defaultValue === 0))
        {
            const v = this.storage[storageTarget].get<T>(this.getKey(key), defaultValue);
            return v || defaultValue;
        }
        return this.storage[storageTarget].get<T>(this.getKey(key));
    }


    async get2<T>(key: string, defaultValue?: T): Promise<T | undefined>
    {
        let store: IDictionary<any> = {};
        try {
            store = await readJsonAsync<IDictionary<any>>(this.storageFile);
        }
        catch {}
        return this._get2(key, store, defaultValue);
    }


    get2Sync<T>(key: string, defaultValue?: T): T | undefined
    {
        let store: IDictionary<any> = {};
        try {
            store = readJsonSync<IDictionary<any>>(this.storageFile);
        }
        catch {}
        return this._get2(key, store, defaultValue);
    }


    // getSecret = <T>(key: string) => this.secrets.get(this.getKey(key));


    getSecret = async <T = string>(key: string, defaultValue?: T) =>
    {
        const secret = await this.secrets.get(this.getKey(key));
        let value = secret as T | undefined;
        if (secret) { try { value = JSON.parse(secret); } catch {} }
        return value ? value : defaultValue;
    };


    // update = (key: string, value: any) => this.storage.update(key, value);
    update = async(key: string, value: any, storageTarget: StorageTarget = StorageTarget.Global) =>
    {
        await this.storage[storageTarget].update(this.getKey(key), value);
        this._onDidChange.fire({ key, workspace: false });
    };


    async update2(key: string, value: any)
    {
        let store: IDictionary<any> = {};
        try {
            store = await readJsonAsync<IDictionary<any>>(this.storageFile);
        }
        catch  {}
        try {
            JSON.stringify(value); // Ensure json compatible value
            store[this.getKey(key)] = value;
            const newJson = JSON.stringify(store);
            await writeFile(this.storageFile, newJson);
            this._onDidChange.fire({ key, workspace: false });
        }
        catch {}
    }


    update2Sync(key: string, value: any)
    {
        let store: IDictionary<any> = {};
        try {
            store = readJsonSync<IDictionary<any>>(this.storageFile);
        }
        catch {}
        try {
            JSON.stringify(value); // Ensure json compatible value
            store[this.getKey(key)] = value;
            const newJson = JSON.stringify(store);
            writeFileSync(this.storageFile, newJson);
            this._onDidChange.fire({ key, workspace: false });
        }
        catch {}
    }


    updateSecret = (key: string, value: string | undefined): Thenable<void> =>
    {
        if (value !== undefined) {
            return this.secrets.store(this.getKey(key), value);
        }
        return this.secrets.delete(this.getKey(key));
    };

}
