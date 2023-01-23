
import { join } from "path";
import { Memento, ExtensionContext, SecretStorage } from "vscode";
import { IDictionary } from "../../interface";
import { IStorage } from "../../interface/IStorage";
import { createDir, pathExists, readJsonAsync, readJsonSync, writeFile, writeFileSync } from "./fs";
import { isNumber, isString } from "./utils";

export let storage: IStorage;


export const initStorage = async (context: ExtensionContext, isDev: boolean, isTests: boolean) =>
{
    const storageFile = join(context.globalStorageUri.fsPath, "storage.json");
    await createDir(context.globalStorageUri.fsPath);
    /* istanbul ignore if */
    if (!(await pathExists(storageFile))) {
        await writeFile(storageFile, "{}");
    }
    storage = new Storage(context, storageFile, isDev, isTests);
};


class Storage implements IStorage, Memento
{
    private storage: Memento;
    private secrets: SecretStorage;
    private isDev: boolean;
    private isTests: boolean;
    private storageFile: string;


    constructor(context: ExtensionContext, storageFile: string, isDev: boolean, isTests: boolean)
    {
        this.storage = context.globalState;
        this.secrets = context.secrets;
        this.isDev = isDev;
        this.isTests = isTests;
        this.storageFile = storageFile;
    }


    public getSecret(key: string): Thenable<string | undefined>
    {
        return this.secrets.get(this.getKey(key));
    }


    public updateSecret(key: string, value: any): Thenable<void>
    {
        return this.secrets.store(this.getKey(key), value);
    }


    private getKey = (key: string) => (!this.isTests ? /* istanbul ignore next */"" : (this.isDev ? /* istanbul ignore next */"dev" : "tests")) + key;


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


    public async get2<T>(key: string, defaultValue?: T): Promise<T | undefined>
    {
        let store: IDictionary<any>;
        try {
            store = await readJsonAsync<IDictionary<any>>(this.storageFile);
        }
        catch { /* istanbul ignore next */store = {}; }
        return this._get2(key, store, defaultValue);
    }


    public get2Sync<T>(key: string, defaultValue?: T): T | undefined
    {
        let store: IDictionary<any>;
        try {
            store = readJsonSync<IDictionary<any>>(this.storageFile);
        }
        catch { /* istanbul ignore next */store = {}; }
        return this._get2(key, store, defaultValue);
    }


    public async update2(key: string, value: any)
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
        }
        catch {}
    }


    public update2Sync(key: string, value: any)
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
        }
        catch {}
    }


    public get<T>(key: string, defaultValue?: T): T | undefined
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


    // update = (key: string, value: any) => this.storage.update(key, value);
    public async update(key: string, value: any)
    {
        await this.storage.update((!this.isTests ? /* istanbul ignore next */"" : "tests") + key, value);
    }
}
