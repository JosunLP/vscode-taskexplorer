/* eslint-disable prefer-arrow/prefer-arrow-functions */

import { IDictionary } from "../../interface";

/**
 * @module commonUtils
 * @since 3.0.0
 *
 * Module file reserved for utils functions that need to be called from other utils modules,
 * kept separate so as not to cause create circular dependencies bet the various utils modules.
 */


// /**
//  * @since 3.0.0
//  * @param obj Source object
//  * @param keys Set of keys to pick from source object
//  */
// export const pick = <T, K extends keyof T>(obj: T, ...keys: K[]) =>
// {
//     const ret: any = {};
//     keys.forEach(key => {
//       ret[key] = obj[key];
//     });
//     return ret;
// };


/**
 * @since 3.0.0
 * @param obj Source object
 * @param pickFn Callback function to specify keys to pick from source object
 */
export const pickBy = <T extends IDictionary<any>>(obj: T, pickFn: <K extends keyof T>(k: K) => boolean | undefined): T =>
{
    const ret: any = {};
    Object.keys(obj).filter(k => pickFn(k)).forEach(key => ret[key] = obj[key]);
    return ret;
};


export function properCase(name: string | undefined, removeSpaces?: boolean)
{
    if (!name) {
      return "";
    }
    return name.replace(/(?:^\w|[A-Z]|\b\w)/g, (ltr) => ltr.toUpperCase()).replace(/[ ]+/g, !removeSpaces ? " " : "");
}
