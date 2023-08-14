import { TeWrapper } from "./lib/wrapper";
import { ExtensionContext } from "vscode";
export declare function activate(context: ExtensionContext): Promise<import("./lib/api").TeApi | TeWrapper>;
export declare function deactivate(): Promise<void>;
