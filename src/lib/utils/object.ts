
import { isObject } from "./typeUtils";
import { IDictionary } from "../../interface";


export const apply = <T>(object: IDictionary<any>, config: IDictionary<any>, defaults?: IDictionary<any>): T =>
{
    if (object)
    {
        if (defaults) {
            apply(object, defaults);
        }
        if (isObject(config)) {
            Object.keys(config).forEach((i) => { object[i] = config[i]; });
        }
    }
    return object as T;
};


// export const clone = <T>(item: any) =>
// {
//     if (!item) {
//         return item;
//     }
//     //
//     // Date
//     //
//     if (isDate(item)) {
//         return new Date(item.getTime());
//     }
//     //
//     // Array
//     //
//     if (isArray(item))
//     {
//         let i = item.length;
//         const c: any[] = [];
//         while (i--) { c[i] = clone(item[i]); }
//         return c;
//     }
//     //
//     // Object
//     //
//     else if (isObject(item))
//     {
//         const c: IDictionary<any> = {};
//         Object.keys((item)).forEach((key) =>
//         {
//             c[key] = clone(item[key]);
//         });
//         return c;
//     }
//
//     return item as T;
// };
//
//
// export const diff = (oldObj: IDictionary<any>, newObj: IDictionary<any>): ObjectDiff =>
// {
//     const _equals = (a: any, b: any) =>
//     {
//         if (isArray(a) && isArray(b) && a.length === b.length && a.every((val, index) => val === b[index]))
//         {
//             return true;
//         }
//         return a === b;
//     };
//
//     const _flatten = (obj: IDictionary<any>) =>
//     {
//         const object: IDictionary<any> = {},
//               path: string[] = [];
//         const dig = (obj: IDictionary<any>) =>
//         {
//             for (const [ key, value ] of Object.entries(obj))
//             {
//                 path.push(key);
//                 if (isObject(value)) {
//                     dig(value);
//                 }
//                 else {
//                     object[path.join(".")] = value;
//                 }
//                 path.pop();
//             }
//         };
//         dig(obj);
//         return object;
//     };
//
//     const _diffFlatten = (oldFlat: IDictionary<any>, newFlat: IDictionary<any>) =>
//     {
//         const previous = Object.assign({}, oldFlat);
//         const current = Object.assign({}, newFlat);
//         for (const key in newFlat)
//         {
//             if (_equals(newFlat[key], oldFlat[key]))
//             {
//                  delete previous[key];
//                  delete current[key];
//             }
//         }
//         return [ previous, current ];
//     };
//
//     const _unflatten = (flattenObject: IDictionary<any>): IDictionary<any> =>
//     {
//         const unFlatten: IDictionary<any> = {};
//         for (const [ stringKeys, value ] of Object.entries(flattenObject))
//         {
//             const chain = stringKeys.split(".");
//             let object = unFlatten;
//             for (const [ i, key ] of chain.slice(0, -1).entries())
//             {
//                 if (!object[key])
//                 {
//                     const needArray = Number.isInteger(Number(chain[+i + 1])); // TODO - Needed?
//                     object[key] = !needArray ? {} : /* istanbul ignore next */[];
//                 }
//                 object = object[key];
//             }
//             const lastkey = chain.pop() as string;
//             object[lastkey] = value;
//         }
//         return unFlatten;
//     };
//
//     const flatOldObject = _flatten(oldObj),
//           flatNewObject = _flatten(newObj),
//           flatDiff = _diffFlatten(flatOldObject, flatNewObject),
//           [ previous, current ] = flatDiff;
//
//     return { previous: _unflatten(previous), current: _unflatten(current) };
// };
//
//
// /*
// export const diff2 = <T extends IDictionary<any>>(oldObj: IDictionary<any>, newObj: IDictionary<any>, deep = false): ObjectDiff  =>
// {
//     const added: IDictionary<any> = {},
//           updated: IDictionary<any> = {},
//           removed: IDictionary<any> = {},
//           unchanged: IDictionary<any> = {};
//
//     for (const oldProp in oldObj)
//     {
//         if ((typeof oldObj).hasOwnProperty.call(oldObj, oldProp))
//         {
//             const newPropValue = newObj[oldProp];
//             const oldPropValue = oldObj[oldProp];
//             if ((typeof newObj).hasOwnProperty.call(newObj, oldProp))
//             {
//                 if (newPropValue === oldPropValue) {
//                     unchanged[oldProp] = oldPropValue;
//                 }
//                 else {
//                     updated[oldProp] = deep && isObject(oldPropValue, true) && isObject(newPropValue, true) ?
//                         diff(oldPropValue, newPropValue, deep) : { newValue: newPropValue };
//                 }
//             }
//             else {
//                 removed[oldProp] = oldPropValue;
//             }
//         }
//     }
//
//     for (const newProp in newObj)
//     {
//         if ((typeof newObj).hasOwnProperty.call(newObj, newProp))
//         {
//             const oldPropValue = oldObj[newProp];
//             const newPropValue = newObj[newProp];
//             if ((typeof oldObj).hasOwnProperty.call(oldObj, newProp))
//             {
//                 if (oldPropValue !== newPropValue)
//                 {
//                     if (!deep || !isObject(oldPropValue, true)) {
//                         updated[newProp].oldValue = oldPropValue;
//                     }
//                 }
//             }
//             else {
//                 added[newProp] = newPropValue;
//             }
//         }
//     }
//
//     return { added, updated, removed, unchanged };
// };
//
//
// export const diff3 = <T extends IDictionary<any>>(obj1: any, obj2: any): Partial<T> =>
// {
//     const diffObj = isArray(obj2) ? [] : {} as IDictionary<any>;
//     Object.getOwnPropertyNames(obj2).forEach(function(prop)
//     {
//         if (isObject(obj2[prop]))
//         {
//             diffObj[prop] = diff(obj1[prop], obj2[prop]);
//             if (isArray(diffObj[prop]) && Object.getOwnPropertyNames(diffObj[prop]).length === 1 || Object.getOwnPropertyNames(diffObj[prop]).length === 0)
//             {
//                 delete diffObj[prop];
//             }
//         }
//         else if (obj1[prop] !== obj2[prop])
//         {
//             diffObj[prop] = obj2[prop];
//         }
//     });
//     return diffObj as Partial<T>;
// };
//
//
// export const diff2 = (obj1: any, obj2: any) =>
// {
//
//     let d: any;
//
//     if (!isObject(obj1, true) || !isObject(obj2, true))
//     {
//         let type = "";
//         if (obj1 === obj2 || (isDate(obj1) && isDate(obj2) && obj1.getTime() === obj2.getTime())) {
//             type = "unchanged";
//         }
//         else if (!isDefined(obj1)) {
//             type = "created";
//         }
//         if (!isDefined(obj2)) {
//             type = "deleted";
//         }
//         else if (type === "") {
//             type = "updated";
//         }
//         return {
//             type,
//             data: (obj1 === undefined) ? obj2 : obj1
//         };
//     }
//
//     if (isArray(obj1) && isArray(obj2))
//     {
//         const d = [];
//         obj1.sort(); obj2.sort();
//         for (let i = 0; i < obj2.length; i++)
//         {
//             const type = obj1.indexOf(obj2[i]) === -1 ? "created" : "unchanged";
//             if (type === "created" && isObject(obj2[i], true))
//             {
//                 d.push(
//                     diff(obj1[i], obj2[i])
//                 );
//                 continue;
//             }
//             d.push({
//                 type,
//                 data: obj2[i]
//             });
//         }
//
//         for (let i = 0; i < obj1.length; i++)
//         {
//             if (obj2.indexOf(obj1[i]) !== -1 || isObject(obj1[i], true))
//                 {continue; }
//             d.push({
//                 type: "deleted",
//                 data: obj1[i]
//             });
//         }
//     }
//     else
//     {
//         const d: IDictionary<any> = {};
//         let key = Object.keys(obj1);
//         for (let i = 0; i < key.length; i++)
//         {
//             let value2;
//             if (isDefined(obj2[key[i]])) {
//                 value2 = obj2[key[i]];
//             }
//             d[key[i]] = diff(obj1[key[i]], value2);
//         }
//
//         key = Object.keys(obj2);
//         for (let i = 0; i < key.length; i++)
//         {
//             if (isDefined(d[key[i]])) {
//                 continue;
//             }
//             d[key[i]] = diff(undefined, obj2[key[i]]);
//         }
//     }
//
//     return d;
// };
// */
//
//
// export const merge = <T>(...destination: IDictionary<any>[]): T =>
// {
//     const ln = destination.length;
//     for (let i = 1; i < ln; i++)
//     {
//         const object = destination[i];
//         Object.keys(object).forEach((key) =>
//         {
//             const value = object[key];
//             if (isObject(value))
//             {
//                 const sourceKey = destination[0][key];
//                 if (isObject(sourceKey))
//                 {
//                     merge(sourceKey, value);
//                 }
//                 else {
//                     destination[0][key] = clone(value);
//                 }
//             }
//             else {
//                 destination[0][key] = value;
//             }
//         });
//     }
//     return destination[0] as T;
// };
//
//
// export const mergeIf = <T>(...destination: IDictionary<any>[]): T =>
// {
//     const ln = destination.length;
//     for (let i = 1; i < ln; i++)
//     {
//         const object = destination[i];
//         for (const key in object)
//         {
//             if (!(key in destination[0]))
//             {
//                 const value = object[key];
//                 if (isObject(value))
//                 {
//                     destination[0][key] = clone(value);
//                 }
//                 else {
//                     destination[0][key] = value;
//                 }
//             }
//         }
//     }
//     return destination[0] as T;
// };
//
//
// export const pick = <T extends Record<string, any>, K extends keyof T>(obj: T, ...keys: K[]): T =>
// {
//     const ret: Record<K, any> = {} as Record<K, any>;
//     keys.forEach(key => { ret[key] = obj[key]; });
//     return ret as T;
// };
//
//
export const pickBy = <T extends Record<string, any>>(obj: T, pickFn: <K extends keyof T>(k: K) => boolean | undefined): T =>
{
    const ret: Record<string, any> = {};
    Object.keys(obj).filter(k => pickFn(k)).forEach(key => ret[key] = obj[key]);
    return ret as T;
};
//
//
// export const pickNot = <T extends Record<string, any>, K extends keyof T>(obj: T, ...keys: K[]): T =>
// {
//     const ret = apply<T>({}, obj);
//     keys.forEach(key => { delete ret[key]; });
//     return ret;
// };
//