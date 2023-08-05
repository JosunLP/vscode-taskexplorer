
// import { WpBuildRuntimeVariables, __WPBUILD__ } from "../webpack/types";

export * from "../src/interface";
export * from "../src/lib/utils/log";
export * from "../src/lib/wrapper";
export * from "../src/lib/utils/fs";
export * from "../src/lib/utils/utils";
export * from "../src/lib/utils/taskUtils";
export * from "../src/lib/utils/typeUtils";
export * from "../src/lib/utils/pathUtils";
export * from "../src/lib/utils/promiseUtils";
export * from "../src/tree/node/file";
export * from "../src/tree/node/folder";
export * from "../src/tree/node/item";

// export { WpBuildRuntimeVariables, __WPBUILD__ };


/**
 * Base Types
 */

export type Primitive = boolean | number | string;

/**
 * Base Interfaces
 */

interface IDictionary<TValue> extends Record<string, TValue> {}
export type { IDictionary, IDictionary as IDict };

