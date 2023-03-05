
import { join } from "path";
import { IDictionary } from "../interface";
import { isNumber, isString } from "./utils/utils";
import { IStorage, StorageChangeEvent } from "../interface/IStorage";
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


class Storage implements IStorage, Memento
{
    private isDev: boolean;
    private isTests: boolean;
    private storage: Memento;
    private storageFile: string;
    private secrets: SecretStorage;
    private _onDidChange = new EventEmitter<StorageChangeEvent>();
	private _onDidChangeSecrets = new EventEmitter<SecretStorageChangeEvent>();


    constructor(context: ExtensionContext, storageFile: string)
    {
        this.storage = context.globalState;
        this.secrets = context.secrets;
        this.isDev = context.extensionMode === ExtensionMode.Development;
        this.isTests = context.extensionMode === ExtensionMode.Test;
        this.storageFile = storageFile;
        context.subscriptions.push(context.secrets.onDidChange(e => this._onDidChangeSecrets.fire(e)));
    }


	get onDidChange(): Event<StorageChangeEvent> {
		return this._onDidChange.event;
	}

	get onDidChangeSecrets(): Event<SecretStorageChangeEvent> {
		return this._onDidChangeSecrets.event;
	}


    delete = async(key: string) =>
    {
        await this.storage.update(this.getKey(key), undefined);
        this._onDidChange.fire({ key, workspace: false });
    };


    deleteSecret = (key: string) => this.secrets.delete(this.getKey(key));


    keys(): readonly string[]
    {
        const keys = Object.keys((this.storage as any)._value);
        return keys.filter((key) => this.storage.get(key) !== undefined);
    }


    private getKey = (key: string) => (!this.isDev && !this.isTests ? /* istanbul ignore next */"" :
                                      (this.isDev ? /* istanbul ignore next */"dev" : "tests")) + key;


    private _get2<T>(key: string, store: IDictionary<T>, defaultValue?: T): T | undefined
    {
        if (defaultValue || (isString(defaultValue) && defaultValue === "") || (isNumber(defaultValue) && defaultValue === 0))
        {
            let v = store[this.getKey(key)];
            if (!v) {
                v = defaultValue;
            }
            return v;
        }
        return store[(!this.isTests ? /* istanbul ignore next */"" : "tests") + key];
    }


    get<T>(key: string, defaultValue?: T): T | undefined
    {
        if (defaultValue || (isString(defaultValue) && defaultValue === "") || (isNumber(defaultValue) && defaultValue === 0))
        {
            let v = this.storage.get<T>(this.getKey(key), defaultValue);
            //
            // why have to do this?  In one case, passing a default of [] for a non-existent
            // value, the VSCode memento does not return[]. It returns an empty string????
            // So perform a double check if the value is falsy.
            //
            /* istanbul ignore if */
            if (!v) {
                v = defaultValue;
            }
            return v;
        }
        return this.storage.get<T>(this.getKey(key));
    }


    async get2<T>(key: string, defaultValue?: T): Promise<T | undefined>
    {
        let store: IDictionary<any>;
        try {
            store = await readJsonAsync<IDictionary<any>>(this.storageFile);
        }
        catch { /* istanbul ignore next */store = {}; }
        return this._get2(key, store, defaultValue);
    }


    get2Sync<T>(key: string, defaultValue?: T): T | undefined
    {
        let store: IDictionary<any>;
        try {
            store = readJsonSync<IDictionary<any>>(this.storageFile);
        }
        catch { /* istanbul ignore next */store = {}; }
        return this._get2(key, store, defaultValue);
    }


    // getSecret = <T>(key: string) => this.secrets.get(this.getKey(key));


    getSecret = async <T = string>(key: string, defaultValue?: T) =>
    {
        const secret = await this.secrets.get(this.getKey(key));
        return secret ? JSON.parse(secret) as T : defaultValue;
    };


    // update = (key: string, value: any) => this.storage.update(key, value);
    update = async(key: string, value: any) =>
    {
        await this.storage.update(this.getKey(key), value);
        this._onDidChange.fire({ key, workspace: false });
    };


    async update2(key: string, value: any)
    {
        let store: IDictionary<any>;
        try {
            store = await readJsonAsync<IDictionary<any>>(this.storageFile);
        }
        catch  { /* istanbul ignore next */store = {}; }
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
        let store: IDictionary<any>;
        try {
            store = readJsonSync<IDictionary<any>>(this.storageFile);
        }
        catch { /* istanbul ignore next */store = {}; }
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
        if (value) {
            return this.secrets.store(this.getKey(key), value);
        }
        return this.secrets.delete(this.getKey(key));
    };

}
