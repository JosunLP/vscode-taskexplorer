/* eslint-disable prefer-arrow/prefer-arrow-functions */

import { TeWrapper } from "./lib/wrapper";
import { ExtensionContext, ExtensionMode } from "vscode";

let teWrapper: TeWrapper;

export async function activate(context: ExtensionContext)
{
    console.log(" activate wtf 1");
    const isTests = context.extensionMode === ExtensionMode.Test;
    teWrapper = await TeWrapper.create(context);
    return isTests ? teWrapper : /* istanbul ignore next */teWrapper.api;
}

/* istanbul ignore next */
export async function deactivate()
{
    teWrapper.context.subscriptions.splice(0).forEach(d => d.dispose());
}
