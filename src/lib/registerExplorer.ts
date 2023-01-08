/* eslint-disable prefer-arrow/prefer-arrow-functions */

import log from "./utils/log";
import { TaskTreeDataProvider } from "../tree/tree";
import { ExtensionContext, window, TreeView, TreeItem } from "vscode";
import { IExplorerApi, ITaskExplorerApi } from "../interface";

const views: { [taskType: string]: TreeView<TreeItem> | undefined } = {};


export function registerExplorer(name: "taskExplorer"|"taskExplorerSideBar", context: ExtensionContext, enabled: boolean, teApi: ITaskExplorerApi, isActivation: boolean)
{
    let view = views[name];
    log.write("Register explorer view / tree provider '" + name + "'", 1, "   ");

    if (enabled)
    {
        /* istanbul ignore else */
        if (!view)
        {
            const treeDataProvider = new TaskTreeDataProvider(name, context, teApi.isTests()),
                  treeView = window.createTreeView(name, { treeDataProvider, showCollapseAll: true });
            views[name] = treeView;
            view = views[name];
            /* istanbul ignore else */
            if (view)
            {
                view.onDidChangeVisibility(e => { treeDataProvider.onVisibilityChanged(e.visible); }, treeDataProvider);
                context.subscriptions.push(view);
                log.write("   Tree data provider registered'" + name + "'", 1, "   ");
            }
            if (name === "taskExplorer")
            {
                teApi.explorer = treeDataProvider;
                teApi.explorer.setEnabled(!isActivation);
                teApi.explorerView = view;
            }
            else // name === "taskExplorerSideBar"
            {
                teApi.sidebar = treeDataProvider;
                teApi.sidebar.setEnabled(!isActivation);
                teApi.sidebarView = view;
            }
        }
    }
    else
    {
        if (view)
        {
            if (name === "taskExplorer" && teApi.explorer)
            {
                teApi.explorer.dispose(context);
                teApi.explorer = undefined;
                teApi.explorerView = undefined;
            }
            /* istanbul ignore else */
            else if (teApi.sidebar) // name === "taskExplorerSideBar"
            {
                teApi.sidebar.dispose(context);
                teApi.sidebar = undefined;
                teApi.sidebarView = undefined;
            }
            views[name] = undefined;
            view.dispose();
        }
    }

    teApi.testsApi.explorer = teApi.explorer /* istanbul ignore next */|| teApi.sidebar || {} as IExplorerApi;
}
