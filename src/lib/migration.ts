
import { workspace } from "vscode";
import { getMd5 } from "@env/crypto";
import { ConfigKeys, IConfiguration, IStorage, StorageTarget } from "../interface";
import { getTaskTypeEnabledSettingName, getTaskTypes, getTaskTypeSettingName } from "./utils/taskUtils";


export class TeMigration
{
    constructor(private readonly storage: IStorage, private readonly configuration: IConfiguration) {}

    migrateSettings = async () =>
    {
        const didSettingUpgrade = this.storage.get<boolean>("taskexplorer.v3SettingsUpgrade", false);
        /* istanbul ignore next */
        if (!didSettingUpgrade)
        {
            const oldConfig = workspace.getConfiguration("taskExplorer");

            const groupSep = oldConfig.get<string>(ConfigKeys.GroupSeparator, "-");
            if (groupSep !== "-" && groupSep !== "_" && groupSep !== ":" && groupSep !== "|") {
                await this.configuration.update(ConfigKeys.GroupSeparator, "-");
            }

            const taskTypes = getTaskTypes();
            taskTypes.push("ansicon");
            for (const taskType of taskTypes)
            {
                let oldEnabledSetting = getTaskTypeSettingName(taskType, "enable"),
                    newEnabledSetting = getTaskTypeEnabledSettingName(taskType);
                const oldSettingValue1 = oldConfig.get<boolean | undefined>(oldEnabledSetting, undefined) ||
                                        oldConfig.get<boolean | undefined>(newEnabledSetting, undefined);
                if (oldSettingValue1 !== undefined)
                {
                    await this.configuration.update(newEnabledSetting, oldSettingValue1);
                }

                oldEnabledSetting = getTaskTypeSettingName(taskType, "pathTo");
                newEnabledSetting = getTaskTypeSettingName(taskType, "pathToPrograms.");
                const oldSettingValue2 = oldConfig.get<string | undefined>(oldEnabledSetting, undefined) ||
                                        oldConfig.get<string | undefined>(newEnabledSetting, undefined);
                if (oldSettingValue2 !== undefined)
                {
                    await this.configuration.update(newEnabledSetting, oldSettingValue2);
                }
            }
            await this.storage.update("taskexplorer.v3SettingsUpgrade", true);
        }
    };


    migrateStorage = async () =>
    {
        let didStorageUpgrade = this.storage.get<boolean>("taskexplorer.v3StorageUpgrade", false);
        /* istanbul ignore next */
        if (!didStorageUpgrade)
        {
            let ts = Date.now();
            let store = this.storage.get<string[]>("lastTasks", []).map(id => ({ id, timestamp: ++ts }));
            await this.storage.update("taskexplorer.specialFolder.last", store);
            store = this.storage.get<string[]>("lastTasks", [], StorageTarget.Workspace).map(id => ({ id, timestamp: ++ts }));
            await this.storage.update("taskexplorer.specialFolder.last", store, StorageTarget.Workspace);
            store = this.storage.get<string[]>("favoriteTasks", []).map(id => ({ id, timestamp: ++ts }));
            await this.storage.update("taskexplorer.specialFolder.favorites", store);
            store = this.storage.get<string[]>("favoriteTasks", [], StorageTarget.Workspace).map(id => ({ id, timestamp: ++ts }));
            await this.storage.update("taskexplorer.specialFolder.favorites", store, StorageTarget.Workspace);
            await this.storage.delete("lastTasks");
            await this.storage.delete("favoriteTasks");
            await this.storage.update("taskexplorer.v3StorageUpgrade", true);
        }
        didStorageUpgrade = this.storage.get<boolean>("taskexplorer.v3StorageUpgrade2", false);
        /* istanbul ignore next */
        if (!didStorageUpgrade)
        {
            let store = this.storage.get<{ id: string; timestamp: number }[]>("taskexplorer.specialFolder.last", []);
            store.forEach(t => { t.id = getMd5(t.id, "hex"); });
            await this.storage.update("taskexplorer.specialFolder.last", store);
            store = this.storage.get<{ id: string; timestamp: number }[]>("taskexplorer.specialFolder.last", [], StorageTarget.Workspace);
            store.forEach(t => { t.id = getMd5(t.id, "hex"); });
            await this.storage.update("taskexplorer.specialFolder.last", store, StorageTarget.Workspace);
            store = this.storage.get<{ id: string; timestamp: number }[]>("taskexplorer.specialFolder.favorites", []);
            store.forEach(t => { t.id = getMd5(t.id, "hex"); });
            await this.storage.update("taskexplorer.specialFolder.favorites", store);
            store = this.storage.get<{ id: string; timestamp: number }[]>("taskexplorer.specialFolder.favorites", [], StorageTarget.Workspace);
            store.forEach(t => { t.id = getMd5(t.id, "hex"); });
            await this.storage.update("taskexplorer.specialFolder.favorites", store, StorageTarget.Workspace);
            await this.storage.update("taskexplorer.v3StorageUpgrade2", true);
        }
    };


}
