/* eslint-disable prefer-arrow/prefer-arrow-functions */

import { TeLog } from "./lib/utils/log";
import { TeWrapper } from "./lib/wrapper";
import { TeMigration } from "./lib/migration";
import { initStorage, storage } from "./lib/storage";
import { ExtensionContext, ExtensionMode } from "vscode";
import { configuration, initConfiguration } from "./lib/configuration";

let teWrapper: TeWrapper;


export async function activate(context: ExtensionContext)
{
    const isTests = context.extensionMode === ExtensionMode.Test;
    //
    // TODO - Handle untrusted workspace
    //
    // if (!workspace.isTrusted) {
	// 	void setContext(ContextKeys.Untrusted, true);
	// 	context.subscriptions.push(
	// 		workspace.onDidGrantWorkspaceTrust(() => {
	// 			void setContext(ContextKeys.Untrusted, undefined);
	// 			container.telemetry.setGlobalAttribute('workspace.isTrusted', workspace.isTrusted);
	// 		}),
	// 	);
	// }
    //
    // Initialize configuration
    //
    initConfiguration(context);
    //
    // Initialize logging
    //    0=off | 1=on w/red&yellow | 2=on w/ no red/yellow
    //
    const log = new TeLog(context, configuration, isTests ? 2 : /* istanbul ignore next */ 0);
    await log.init(context.logUri.fsPath);
    log.methodStart("extension activation", 1, "", true);
    //
    // Initialize persistent storage
    //
    await initStorage(context);
    //
    // Perform any necessary migration to configuration and storage, pre-wrapper initialization
    //
    const migration = new TeMigration(storage, configuration);
    await migration.migrateSettings();
    await migration.migrateStorage();
    //
    // Instantiate application wrapper (beautiful old school c project concept that I never knew
    // anyone used anymore.  The GitLens project uses it, so, love his work so i guess it's ok ;)
    //
    teWrapper = new TeWrapper(context, storage, configuration, log);
	await teWrapper.init();
    //
    // Activation complete. For tests return the app wrapper, otherwise return the api
    //
    log.write("   activation completed successfully, work pending", 1);
    log.methodDone("extension activation", 1);
    return isTests ? teWrapper : /* istanbul ignore next */teWrapper.api;
}


/* istanbul ignore next */
export async function deactivate()
{   //
    // Detect when a folder move occurs and the ext is about to deactivate/re-activate.  A
    // folder move that changes the first workspace folder will restart the extension
    // unfortunately.  Changing the first workspace folder modifies the deprecated `rootPath`
    // and I think that's why the reload is needed or happens.  A timesptamp is set by the
    // fileWatcher module in the workspaceFolderChanged event on extension activation that and
    // the below `lastDeactivated' flag is used to determine if it is being activated because
    // of this scenario, in which case we'll load from this stored file cache so that the tree
    // reload is much quicker, especially in large workspaces.
    //
    if (!teWrapper.fileCache.isBusy && !teWrapper.config.get<boolean>(teWrapper.keys.Config.EnablePersistenFileCache))
    {
        const now = Date.now(),
              lastWsRootPathChange = teWrapper.storage.get2Sync<number>("lastWsRootPathChange", 0);
        if (now < lastWsRootPathChange + 3000)
        {
            teWrapper.fileCache.persistCache(false, true);
        }
    }
    teWrapper.storage.update2Sync("lastDeactivated", Date.now());
    //
    // VSCode will/would dispose() items in subscriptions but it won't be covered.  So dispose
    // everything here, it doesn't seem to cause any issue with Code exiting.
    //
    teWrapper.context.subscriptions.forEach((s) => {
        s.dispose();
    });
    teWrapper.context.subscriptions.splice(0);
}
