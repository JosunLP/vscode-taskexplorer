
import { error } from "./error";
import { figures } from "../utils/figures";
import { ILogControl } from "../../interface";

let logControl: ILogControl;
export const setLogControl = (lc: ILogControl) => { logControl = lc; };

export const warn = (msg: any, params?: (string|any)[][], queueId?: string) =>
    error(msg, params, queueId, [ !logControl.isTests || !logControl.isTestsBlockScaryColors ? figures.color.warning : figures.color.warningTests, figures.warning ]);
