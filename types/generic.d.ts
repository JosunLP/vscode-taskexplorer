
/**
 * Generic Typings
 */

export type AsArray<T = any> = T extends any[] ? T : [T];
export type PickByType<T, Value> = { [P in keyof T as T[P] extends Value | undefined ? P : never]: T[P] };
export type RequireKeys<T extends object, K extends keyof T> = Required<Pick<T, K>> & Omit<T, K>;

/**
 * Base Types
 */

export type Primitive = boolean | number | string;

/**
 * Base Interfaces
 */

interface IDictionary<TValue> extends Record<string, TValue> {}
export type { IDictionary, IDictionary as IDict };
