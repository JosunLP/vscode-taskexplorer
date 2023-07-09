
/**
 * Base Types
 */

export type Primitive = boolean | number | string;

/**
 * Base Interfaces
 */

interface IDictionary<TValue> extends Record<string, TValue> {}
export type { IDictionary, IDictionary as IDict };
