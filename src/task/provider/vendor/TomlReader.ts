/* eslint-disable id-blacklist */
/* eslint-disable @typescript-eslint/naming-convention */

export default {};

// export interface ITomlException { message: string; token: string }
// export interface ILexingError { offset: number; line: number; column: number; length: number; message: string }
//
// export type TomlError = ILexingError | ITomlException;
//
//
// export class TomlReader
// {
//     private entries: any;
//     private result: any;
//     private errors: any[];
//     private table = "table";
//     private lexer: any;
//     private parser: any;
//
//     constructor()
//     {
//         this.errors = [];
//     }
//
//     readToml = (input: any, fullValue: boolean | undefined) =>
//     {
//         if (fullValue === void 0) { fullValue = false; }
//         this.errors = [];
//         const lexerResult = lexer.tomlLexer.tokenize(input);
//         if (lexerResult.errors.length > 0) {
//             this.errors = lexerResult.errors;
//             this.result = undefined;
//             return;
//         }
//         try {
//             const parser = new p.TomlParser(l.tomlLexerModes);
//             parser.input = lexerResult.tokens;
//             this.entries = parser.documentRule();
//             if (parser.errors.length > 0) {
//                 this.errors = parser.errors;
//                 this.result = undefined;
//                 return;
//             }
//             const fullResult = this.load_toml_document(this.entries, this.errors);
//             this.result = fullValue ? fullResult : this.fullResultToObject(fullResult);
//         }
//         catch (error) {
//             this.errors = [ error ];
//             this.result = undefined;
//         }
//    };
//
//    tomlTable(content: any) {
//        return { type: this.table, content };
//    }
//
//     load_toml_document(entries: any, tomlExceptions: any[])
//     {
//         const root = this.createEmptyTable();
//         // keeps the tables that have been directly defined
//         const directlyInitializedTables: never[] = [];
//         // keep the table arrays defined using [[ ]]
//         const headersInitializedTableArrays: never[] = [];
//         let current = root;
//         for (let _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
//             const entry = entries_1[_i];
//             if (entry.type === this.keysValue) {
//                 if (this.processKeysValue(entry, current, directlyInitializedTables, headersInitializedTableArrays, tomlExceptions, entry.token) === null) {
//                     return null;
//                 }
//             }
//             else if (entry.type === this.tableHeader) {
//                 current = this.init_table(root, entry.headers, directlyInitializedTables, headersInitializedTableArrays, false, tomlExceptions, entry.token, true);
//                 if (current === null) {
//                     return null;
//                 }
//             }
//             else if (entry.type === this.tableArrayEntryHeader) {
//                 current = this.init_table(root, entry.headers, directlyInitializedTables, headersInitializedTableArrays, true, tomlExceptions, entry.token, true);
//                 if (current === null) {
//                     return null;
//                 }
//             }
//         }
//         return root;
//     }
//     isTable(obj: { type: any } | null) {
//         return obj && obj.type === this.table;
//     }
//     isTableArray(obj: any[] | null) {
//         return obj && obj instanceof Array && this.isTable(obj[0]);
//     }
//     isTableOrTableArray(obj: any) {
//         return this.isTable(obj) || this.isTableArray(obj);
//     }
//     init_table(parent: { content: {[x: string]: any }}, names: string | any[], directlyInitializedTables: any[], headersInitializedTableArrays: any[][], isArray: any, tomlExceptions: { message: string; token: any }[], parserToken: any, directlyInitialized: any): any
//      {
//          let context = parent.content[names[0]];
//          if (context !== undefined && !this.isTableOrTableArray(context)) {
//              tomlExceptions.push({
//                  message: "Path already contains a value",
//                  token: parserToken
//              });
//              return null;
//          }
//          else {
//              if (names.length === 1) {
//                  // we are at the table being directly initialized
//                  if (directlyInitializedTables.includes(context)) {
//                      tomlExceptions.push({
//                          message: "Path has already been initialized to a table",
//                          token: parserToken
//                      });
//                      return null;
//                  }
//                  else {
//                      if (this.isTable(context)) {
//                          // value is a table, indirectly initialized
//                          if (isArray) {
//                              tomlExceptions.push({
//                                  message: "Path has already been initialized to a table, not an array table",
//                                  token: parserToken
//                              });
//                              return null;
//                          }
//                          if (directlyInitialized) {
//                              directlyInitializedTables.push(context);
//                          }
//                          return context;
//                      }
//                      else if (this.isTableArray(context)) {
//                          // value is a table array
//                          if (!isArray) {
//                              tomlExceptions.push({
//                                  message: "Path has already been initialized to a table array, not a table",
//                                  token: parserToken
//                              });
//                              return null;
//                          }
//                          if (!headersInitializedTableArrays.includes(context)) {
//                              tomlExceptions.push({
//                                  message: "An static table array has already been initialized for path.",
//                                  token: parserToken
//                              });
//                              return null;
//                          }
//                          else {
//                              const newTable = this.createEmptyTable();
//                              context.push(newTable);
//                              // table arrays are always directly initialized
//                              directlyInitializedTables.push(newTable);
//                              return newTable;
//                          }
//                      }
//                      else if (context === undefined) {
//                          context = this.createEmptyTable();
//                          if (isArray) {
//                              const tableArray = [ context ];
//                              headersInitializedTableArrays.push(tableArray);
//                              parent.content[names[0]] = tableArray;
//                          }
//                          else {
//                              parent.content[names[0]] = context;
//                          }
//                          if (directlyInitialized) {
//                              directlyInitializedTables.push(context);
//                          }
//                          return context;
//                      }
//                      else {
//                          throw new Error("unknown type!");
//                      }
//                  }
//              }
//              else {
//                  if (this.isTable(context)) {
//                      // value is an existing table
//                      return this.init_table(context, names.slice(1), directlyInitializedTables, headersInitializedTableArrays, isArray, tomlExceptions, parserToken, directlyInitialized);
//                  }
//                  else if (this.isTableArray(context)) {
//                      return this.init_table(context.last(), names.slice(1), directlyInitializedTables, headersInitializedTableArrays, isArray, tomlExceptions, parserToken, directlyInitialized);
//                  }
//                  else if (context === undefined) {
//                      // init a table indirectly
//                      context = this.createEmptyTable();
//                      parent.content[names[0]] = context;
//                      return this.init_table(context, names.slice(1), directlyInitializedTables, headersInitializedTableArrays, isArray, tomlExceptions, parserToken, directlyInitialized);
//                  }
//                  else {
//                      throw new Error("unknown type!");
//                  }
//              }
//          }
//     }
//     processKeysValue(kv: { value: any; keys: string | any[] }, current: { content: { [x: string]: any } }, directlyInitializedTables: any[], headersInitializedTableArrays: any, tomlExceptions: { message: string; token: any }[], parserToken: any) {
//         const value = this.tomlValueToObject(kv.value, directlyInitializedTables, headersInitializedTableArrays, tomlExceptions, parserToken);
//         const lastKey = kv.keys[kv.keys.length - 1];
//         // create implicit tables, in dotted keys
//         if (kv.keys.length > 1) {
//             current = this.init_table(current, kv.keys.slice(0, -1), directlyInitializedTables, headersInitializedTableArrays, false, tomlExceptions, parserToken, false);
//         }
//         if (current.content[lastKey] !== undefined) {
//             // can we statically define a table that has been implicitely defined?
//             tomlExceptions.push({
//                 message: "Path has already been initialized to some value",
//                 token: parserToken
//             });
//             return null;
//         }
//         else {
//             current.content[lastKey] = value;
//             if (this.isTable(value)) {
//                 directlyInitializedTables.push(value);
//             }
//             return value;
//         }
//     }
//     everySameType(array: { contents: any[] }) {
//        if (array.contents.length === 0) {
//            return true;
//        }
//        else {
//            const first_1 = array.contents[0];
//            return array.contents.every(item => item.type === first_1.type);
//        }
//     }
//
//     tomlValueToObject(value: { type: any; token: any; contents: any[]; bindings: any }, directlyInitializedTable: any, headersInitializedTableArrays: any, tomlExceptions: { message: string; token: any }[], parserToken: any): any
//     {
//         switch (value.type)
//         {
//             case this.offsetDateTime:
//             case this.localDateTime:
//             case this.localDate:
//             case this.localTime:
//             case this.atomicString:
//             case this.atomicInteger:
//             case this.atomicFloat:
//             case this.atomicNotANumber:
//             case this.atomicInfinity:
//             case this.atomicBoolean:
//                 return value;
//             case this.arrayType:
//                 if (!this.everySameType(value)) {
//                     tomlExceptions.push({
//                         message: "Elements in array are not of the same type",
//                         token: value.token
//                     });
//                     return null;
//                 }
//                 return value.contents.map((item: any) => {
//                     return this.tomlValueToObject(item, directlyInitializedTable, headersInitializedTableArrays, tomlExceptions, parserToken);
//                 });
//             case this.inlineTable:
//                 const newObject = this.createEmptyTable();
//                 for (let _i = 0, _a = value.bindings; _i < _a.length; _i++) {
//                     const kv = _a[_i];
//                     this.processKeysValue(kv, newObject, directlyInitializedTable, headersInitializedTableArrays, tomlExceptions, parserToken);
//                 }
//                 return newObject;
//             default:
//                 console.error("Unhandled value: ", JSON.stringify(value));
//                 return null;
//         }
//     }
//     createEmptyTable() {
//         return this.tomlTable(Object.create(null));
//     }
//     fullResultToObject(input: any): any
//     {
//         if (input instanceof Array) {
//             return input.map(this.fullResultToObject);
//         }
//         else {
//             if (input.type === this.table) {
//                 const obj = Object.create(null);
//                 // eslint-disable-next-line guard-for-in
//                 for (const property in input.content) {
//                     // tables are created with no prototyped content
//                     obj[property] = this.fullResultToObject(input.content[property]);
//                 }
//                 return obj;
//             }
//             else {
//                 return input.value;
//             }
//         }
//     }
//
//     // tomlAtomicValueType = (TomlAtomicValueType = this.TomlAtomicValueType || (this.TomlAtomicValueType = {})) =>
//     // {
//     //    TomlAtomicValueType[TomlAtomicValueType.OffsetDateTime = 0] = "OffsetDateTime";
//     //    TomlAtomicValueType[TomlAtomicValueType.LocalDateTime = 1] = "LocalDateTime";
//     //    TomlAtomicValueType[TomlAtomicValueType.LocalDate = 2] = "LocalDate";
//     //    TomlAtomicValueType[TomlAtomicValueType.LocalTime = 3] = "LocalTime";
//     //    TomlAtomicValueType[TomlAtomicValueType.String = 4] = "String";
//     //    TomlAtomicValueType[TomlAtomicValueType.Integer = 5] = "Integer";
//     //    TomlAtomicValueType[TomlAtomicValueType.Float = 6] = "Float";
//     //    TomlAtomicValueType[TomlAtomicValueType.Boolean = 7] = "Boolean";
//     // };
//
//    offsetDateTime = "offsetDateTime";
//    localDateTime = "localDateTime";
//    localDate = "localDate";
//    localTime = "localTime";
//    atomicString = "atomicString";
//    atomicInteger = "atomicInteger";
//    atomicFloat = "atomicFloat";
//    atomicNotANumber = "atomicNotANumber";
//    atomicInfinity = "atomicInfinity";
//    atomicBoolean = "atomicBoolean";
//    tableHeader = "tableHeader";
//    tableArrayEntryHeader = "tableArrayEntryHeader";
//    arrayType = "tomlArray";
//    inlineTable = "inlineTable";
//    keysValue = "keysValue";
//
//    tomlTableHeader(headers: any, token: any) {
//        return { type: this.tableHeader, headers, token };
//    }
//    tomlTableArrayEntryHeader(headers: any, token: any) {
//        return { type: this.tableArrayEntryHeader, headers, token };
//    }
//    tomlKeysValue(keys: any, value: any, token: any) {
//        return { type: this.keysValue, keys, value, token };
//    }
//    tomlInlineTable(bindings: any) {
//        return { type: this.inlineTable, bindings };
//    }
//    tomlArray(contents: any, token: any) {
//        return { type: this.arrayType, contents, token };
//    }
//
//    // Now, the constructor functions.
//    tomlAtomicOffsetDateTime(image: any, value: any) {
//        return { type: this.offsetDateTime, image, value };
//    }
//    tomlAtomicLocalDateTime(image: any, value: any) {
//        return { type: this.localDateTime, image, value };
//    }
//    tomlAtomicLocalDate(image: any, value: any) {
//        return { type: this.localDate, image, value };
//    }
//    tomlAtomicLocalTime(image: any, value: any) {
//        return { type: this.localTime, image, value };
//    }
//    tomlAtomicString(image: any, value: any) {
//        return { type: this.atomicString, image, value };
//    }
//    tomlAtomicInteger(image: any, value: any) {
//        return { type: this.atomicInteger, image, value };
//    }
//    tomlAtomicFloat(image: any, value: any) {
//        return { type: this.atomicFloat, image, value };
//    }
//    tomlAtomicNotANumber(image: any, value: any) {
//        return { type: this.atomicNotANumber, image, value };
//    }
//    tomlAtomicInfinity(image: any, value: any) {
//        return { type: this.atomicInfinity, image, value };
//    }
//    tomlAtomicBoolean(image: any, value: any) {
//        return { type: this.atomicBoolean, image, value };
//    }
// }
//
// export const table: "table" = "table";
// export interface TomlTable
// {
//     type: typeof table;
//     content: { [key: string]: any };
// }
// export function tomlTable(content: object): TomlTable
// {
//     return { type: table, content };
// }
//
// export type TomlError =
//     | ct.ILexingError
//     | ct.IRecognitionException
//     | ITomlException;
//
// export class TomlReader
// {
//     public result: any;
//     public entries: ast.TopLevelTomlDocumentEntry[];
//     public errors: TomlError[];
//
//     /**
//      * Read a TOML document
//      *
//      * @param input the TOML document string
//      * @param fullValue wheter the full typing information will be returned or not
//      */
//     public readToml(input: string, fullValue: boolean = false)
//     {
//         this.errors = [];
//         const lexerResult = l.tomlLexer.tokenize(input);
//         if (lexerResult.errors.length > 0)
//         {
//             this.errors = lexerResult.errors;
//             this.result = undefined;
//             return;
//         }
//         try
//         {
//             const parser = new p.TomlParser(l.tomlLexerModes);
//             parser.input = lexerResult.tokens;
//             this.entries = parser.documentRule();
//             if (parser.errors.length > 0)
//             {
//                 this.errors = parser.errors;
//                 this.result = undefined;
//                 return;
//             }
//             const fullResult = load_toml_document(this.entries, this.errors);
//             this.result = fullValue ? fullResult : fullResultToObject(fullResult);
//         } catch (error)
//         {
//             this.errors = [error];
//             this.result = undefined;
//         }
//     }
// }
//
// /**
//  * return an object represeting the TOML document, based on entries returned by the parser
//  * which are of one of three types : TomlKeysValue, TomlTableHeader and TomlTableArrayEntryHader
//  *
//  * @param entries the result of a Toml Parser Document Rule
//  * @param tomlExceptions an array that will be filled with toml exceptions, if they occur
//  * @param fullValue whether to return full meta-data for atomic values or not
//  * @return an javascript object representing the toml document
//  */
//
// function load_toml_document(
//     entries: ast.TopLevelTomlDocumentEntry[],
//     tomlExceptions: TomlError[]
// ): TomlTable
// {
//     const root = createEmptyTable();
//     // keeps the tables that have been directly defined
//     const directlyInitializedTables: TomlTable[] = [];
//     // keep the table arrays defined using [[ ]]
//     const headersInitializedTableArrays: TomlTable[][] = [];
//     let current = root;
//     for (const entry of entries)
//     {
//         if (entry.type === ast.keysValue)
//         {
//             if (
//                 processKeysValue(
//                     entry,
//                     current,
//                     directlyInitializedTables,
//                     headersInitializedTableArrays,
//                     tomlExceptions,
//                     entry.token
//                 ) == null
//             )
//             {
//                 return null;
//             }
//         } else if (entry.type === ast.tableHeader)
//         {
//             current = init_table(
//                 root,
//                 entry.headers,
//                 directlyInitializedTables,
//                 headersInitializedTableArrays,
//                 false,
//                 tomlExceptions,
//                 entry.token,
//                 true
//             );
//             if (current == null)
//             {
//                 return null;
//             }
//         } else if (entry.type === ast.tableArrayEntryHeader)
//         {
//             current = init_table(
//                 root,
//                 entry.headers,
//                 directlyInitializedTables,
//                 headersInitializedTableArrays,
//                 true,
//                 tomlExceptions,
//                 entry.token,
//                 true
//             );
//             if (current == null)
//             {
//                 return null;
//             }
//         }
//     }
//     return root;
// }
//
// /**
//  * Returns whether the input is a table or not
//  */
// function isTable(obj: any): obj is TomlTable
// {
//     return obj != null && obj.type === table;
// }
//
// /**
//  * Returns whether the input is an array or tables or not
//  */
// function isTableArray(obj: any): obj is TomlTable[]
// {
//     return obj != null && obj instanceof Array && isTable(obj[0]);
// }
//
// /**
//  * Returns whether the input is a table or an array or tables or not
//  */
// function isTableOrTableArray(obj: {}): obj is TomlTable[] | TomlTable
// {
//     return isTable(obj) || isTableArray(obj);
// }
//
// /**
//  * Create a hierarchy of tables and returns the last one, given a list of names
//  *
//  * @param parent the table to which the new table hierarchy will be attached
//  * @param names the path of the table from parent
//  * @param directlyInitializedTables the list of tables that have already been directly initialized
//  * @param headersInitializedTableArrays list of initialized table arrays ([[..]]) it serves to distinguishdem from arrays of tables ([{...},{...}]) and should not be mixed
//  * @param isArray whether the initialized table is part of a table array ([[..]])
//  * @param tomlExceptions errors
//  * @param parserToken the token of the table
//  * @param directlyInitialized whether the table we are initializing is being directly initialized (which is not the case for dotted keywords)
//  */
// function init_table(
//     parent: TomlTable,
//     names: string[],
//     directlyInitializedTables: TomlTable[],
//     headersInitializedTableArrays: TomlTable[][],
//     isArray: boolean,
//     tomlExceptions: TomlError[],
//     parserToken: ct.IToken,
//     directlyInitialized: boolean
// ): TomlTable
// {
//     let context = parent.content[names[0]];
//     if (context !== undefined && !isTableOrTableArray(context))
//     {
//         tomlExceptions.push({
//             message: "Path already contains a value",
//             token: parserToken
//         });
//         return null;
//     } else
//     {
//         if (names.length === 1)
//         {
//             // we are at the table being directly initialized
//             if (includes(directlyInitializedTables, context))
//             {
//                 tomlExceptions.push({
//                     message: "Path has already been initialized to a table",
//                     token: parserToken
//                 });
//                 return null;
//             } else
//             {
//                 if (isTable(context))
//                 {
//                     // value is a table, indirectly initialized
//                     if (isArray)
//                     {
//                         tomlExceptions.push({
//                             message:
//                                 "Path has already been initialized to a table, not an array table",
//                             token: parserToken
//                         });
//                         return null;
//                     }
//                     if (directlyInitialized)
//                     {
//                         directlyInitializedTables.push(context);
//                     }
//                     return context;
//                 } else if (isTableArray(context))
//                 {
//                     // value is a table array
//                     if (!isArray)
//                     {
//                         tomlExceptions.push({
//                             message:
//                                 "Path has already been initialized to a table array, not a table",
//                             token: parserToken
//                         });
//                         return null;
//                     }
//                     if (!includes(headersInitializedTableArrays, context))
//                     {
//                         tomlExceptions.push({
//                             message:
//                                 "An static table array has already been initialized for path.",
//                             token: parserToken
//                         });
//                         return null;
//                     } else
//                     {
//                         const newTable = createEmptyTable();
//                         context.push(newTable);
//                         // table arrays are always directly initialized
//                         directlyInitializedTables.push(newTable);
//                         return newTable;
//                     }
//                 } else if (context === undefined)
//                 {
//                     context = createEmptyTable();
//                     if (isArray)
//                     {
//                         const tableArray = [context];
//                         headersInitializedTableArrays.push(tableArray);
//                         parent.content[names[0]] = tableArray;
//                     } else
//                     {
//                         parent.content[names[0]] = context;
//                     }
//                     if (directlyInitialized)
//                     {
//                         directlyInitializedTables.push(context);
//                     }
//                     return context;
//                 } else
//                 {
//                     throw "unknown type!";
//                 }
//             }
//         } else
//         {
//             if (isTable(context))
//             {
//                 // value is an existing table
//                 return init_table(
//                     context,
//                     names.slice(1),
//                     directlyInitializedTables,
//                     headersInitializedTableArrays,
//                     isArray,
//                     tomlExceptions,
//                     parserToken,
//                     directlyInitialized
//                 );
//             } else if (isTableArray(context))
//             {
//                 return init_table(
//                     last(context),
//                     names.slice(1),
//                     directlyInitializedTables,
//                     headersInitializedTableArrays,
//                     isArray,
//                     tomlExceptions,
//                     parserToken,
//                     directlyInitialized
//                 );
//             } else if (context === undefined)
//             {
//                 // init a table indirectly
//                 context = createEmptyTable();
//                 parent.content[names[0]] = context;
//                 return init_table(
//                     context,
//                     names.slice(1),
//                     directlyInitializedTables,
//                     headersInitializedTableArrays,
//                     isArray,
//                     tomlExceptions,
//                     parserToken,
//                     directlyInitialized
//                 );
//             } else
//             {
//                 throw "unknown type!";
//             }
//         }
//     }
// }
//
// /**
//  * @param kv the key-value pair
//  * @param current the current context
//  */
// function processKeysValue(
//     kv: ast.TomlKeysValue,
//     current: TomlTable,
//     directlyInitializedTables: any[],
//     headersInitializedTableArrays: TomlTable[][],
//     tomlExceptions: TomlError[],
//     parserToken: ct.IToken
// )
// {
//     const value = tomlValueToObject(
//         kv.value,
//         directlyInitializedTables,
//         headersInitializedTableArrays,
//         tomlExceptions,
//         parserToken
//     );
//     const lastKey = kv.keys[kv.keys.length - 1];
//
//     // create implicit tables, in dotted keys
//     if (kv.keys.length > 1)
//     {
//         current = init_table(
//             current,
//             kv.keys.slice(0, -1),
//             directlyInitializedTables,
//             headersInitializedTableArrays,
//             false,
//             tomlExceptions,
//             parserToken,
//             false
//         );
//     }
//
//     if (current.content[lastKey] !== undefined)
//     {
//         // can we statically define a table that has been implicitely defined?
//         tomlExceptions.push({
//             message: "Path has already been initialized to some value",
//             token: parserToken
//         });
//         return null;
//     } else
//     {
//         current.content[lastKey] = value;
//         if (isTable(value))
//         {
//             directlyInitializedTables.push(value);
//         }
//         return value;
//     }
// }
//
// function everySameType(array: ast.TomlArray)
// {
//     if (array.contents.length === 0)
//     {
//         return true;
//     } else
//     {
//         const first = array.contents[0];
//         return array.contents.every(item => item.type === first.type);
//     }
// }
//
// /**
//  * Returns a toml value transformed to a simple JSON object (a string, a number, an array or an object)
//  * @param value the toml value
//  *
//  * NB - If there were distinct versions of this function (one for full value, one not), we'd get a much
//  * more precise picture of the types for the case of full_value==true.
//  */
// function tomlValueToObject(
//     value: ast.TomlValue,
//     directlyInitializedTable: any[],
//     headersInitializedTableArrays: TomlTable[][],
//     tomlExceptions: TomlError[],
//     parserToken: ct.IToken
// ): any
// {
//     switch (value.type)
//     {
//         case ast.offsetDateTime:
//         case ast.localDateTime:
//         case ast.localDate:
//         case ast.localTime:
//         case ast.atomicString:
//         case ast.atomicInteger:
//         case ast.atomicFloat:
//         case ast.atomicNotANumber:
//         case ast.atomicInfinity:
//         case ast.atomicBoolean:
//             return value;
//         case ast.arrayType:
//             if (!everySameType(value))
//             {
//                 tomlExceptions.push({
//                     message: "Elements in array are not of the same type",
//                     token: value.token
//                 });
//                 return null;
//             }
//             const v = value.contents.map(item =>
//                 tomlValueToObject(
//                     item,
//                     directlyInitializedTable,
//                     headersInitializedTableArrays,
//                     tomlExceptions,
//                     parserToken
//                 )
//             );
//             return v;
//         case ast.inlineTable:
//             const newObject: TomlTable = createEmptyTable();
//             for (const kv of value.bindings)
//             {
//                 processKeysValue(
//                     kv,
//                     newObject,
//                     directlyInitializedTable,
//                     headersInitializedTableArrays,
//                     tomlExceptions,
//                     parserToken
//                 );
//             }
//             return newObject;
//         default:
//             console.error("Unhandled value: ", JSON.stringify(value));
//             return null;
//     }
// }
//
// function createEmptyTable(): TomlTable
// {
//     return tomlTable(Object.create(null));
// }
//
// function fullResultToObject(input: any): any
// {
//     if (input instanceof Array)
//     {
//         return input.map(fullResultToObject);
//     } else
//     {
//         if (input.type === table)
//         {
//             const obj = Object.create(null);
//             for (const property in input.content)
//             {
//                 // tables are created with no prototyped content
//                 obj[property] = fullResultToObject(input.content[property]);
//             }
//             return obj;
//         } else
//         {
//             return input.value;
//         }
//     }
// }
//
// import ct = require("chevrotain");
//
// ct.createToken;
//
// export const OneLineComment = ct.createToken({
//   name: "OneLineComment",
//   pattern: /#.*/,
//   group: ct.Lexer.SKIPPED
// });
//
// // Basic identifiers
// export const Identifier = ct.createToken({
//   name: "Identifier",
//   pattern: /[A-Za-z0-9_-]+/
// });
//
// // Atomic values
// export const Integer = ct.createToken({
//   name: "Integer",
//   pattern: /[+-]?(([1-9](_\d|\d)*)|0)/
// });
//
// export const BinaryInteger = ct.createToken({
//   name: "BinaryInteger",
//   pattern: /0b[10](_[01]|[01])*/
// });
//
// export const OctalInteger = ct.createToken({
//   name: "OctalInteger",
//   pattern: /0o[0-7](_[0-7]|[0-7])*/
// });
//
// export const HexInteger = ct.createToken({
//   name: "HexInteger",
//   pattern: /0x[0-9A-Fa-f](_[0-9A-Fa-f]|[0-9A-Fa-f])*/
// });
//
// export const Float = ct.createToken({
//   name: "Float",
//   pattern: /([+-]?(([1-9](_\d|\d)*)|0+))(((\.([0-9](_\d|\d)*))([Ee]([+-])?(([1-9](_\d|\d)*)|0)))|((\.([0-9](_\d|\d)*))|([Ee]([+-])?(([1-9](_\d|\d)*)|0))))/
// });
//
// export const TomlInfinity = ct.createToken({
//   name: "TomlInfinity",
//   pattern: /[+-]?inf/
// });
//
// export const TomlNotANumber = ct.createToken({
//   name: "TomlNotANumber",
//   pattern: /[+-]?nan/
// });
//
// export const Booolean = ct.createToken({
//   name: "Booolean",
//   pattern: /true|false/
// });
//
// export const OffsetDateTime = ct.createToken({
//   name: "OffsetDateTime",
//   pattern: /-?\d{4}-\d{2}-\d{2}(t|\s)\d{2}:\d{2}:\d{2}(\.\d+)?(z|([-+]\d{2}:\d{2}))/i
// });
//
// export const LocalDateTime = ct.createToken({
//   name: "LocalDateTime",
//   pattern: /-?\d{4}-\d{2}-\d{2}(t|\s)\d{2}:\d{2}:\d{2}(\.\d+)?/i,
//   longer_alt: OffsetDateTime
// });
//
// export const LocalDate = ct.createToken({
//   name: "LocalDate",
//   pattern: /-?\d{4}-\d{2}-\d{2}/i,
//   longer_alt: LocalDateTime
// });
//
// export const LocalTime = ct.createToken({
//   name: "LocalTime",
//   pattern: /\d{2}:\d{2}:\d{2}(\.\d+)?/i
// });
//
// export const EndOfLine = ct.createToken({
//   name: "EndOfLine",
//   pattern: /(\r\n|\n)+/
// });
//
// export const SkippedEndOfLine = ct.createToken({
//   name: "SkippedEndOfLine",
//   pattern: /(\r\n|\n)+/,
//   group: ct.Lexer.SKIPPED
// });
//
// export const WhiteSpace = ct.createToken({
//   name: "WhiteSpace",
//   pattern: /[^\S\n\r]+/,
//   group: ct.Lexer.SKIPPED
// });
//
// export const OpenValue = ct.createToken({
//   name: "OpenValue",
//   pattern: /=/,
//   push_mode: "value"
// });
//
// export const CloseValue = ct.createToken({
//   name: "CloseValue",
//   pattern: /(\r\n|\n)+/,
//   pop_mode: true
// });
//
// export const OpenInlineTable = ct.createToken({
//   name: "OpenInlineTable",
//   pattern: /\{/,
//   push_mode: "inline_table"
// });
//
// export const CloseInlineTable = ct.createToken({
//   name: "CloseInlineTable",
//   pattern: /\}/,
//   pop_mode: true
// });
//
// export const OpenInlineValue = ct.createToken({
//   name: "OpenInlineValue",
//   pattern: /=/,
//   push_mode: "inline_value"
// });
//
// export const CloseInlineValue = ct.createToken({
//   name: "CloseInlineValue",
//   // hackish way to use } as end of value without consuming it
//   pattern: /,|(.{0}(?=}))/,
//   pop_mode: true
// });
//
// export const Comma = ct.createToken({
//   name: "Comma",
//   pattern: /,/
// });
//
// export const Dot = ct.createToken({
//   name: "Dot",
//   pattern: /\./
// });
//
// export const OpenMultiLineBasicString = ct.createToken({
//   name: "OpenMultiLineBasicString",
//   pattern: /"""/,
//   push_mode: "multi_line_basic_string"
// });
//
// export const CloseMultiLineBasicString = ct.createToken({
//   name: "CloseMultiLineBasicString",
//   pattern: /"""/,
//   pop_mode: true
// });
//
// export const OpenBasicString = ct.createToken({
//   name: "OpenBasicString",
//   pattern: /"/,
//   push_mode: "basic_string"
// });
//
// export const CloseBasicString = ct.createToken({
//   name: "CloseBasicString",
//   pattern: /"/,
//   pop_mode: true
// });
//
// export const OpenLiteralString = ct.createToken({
//   name: "OpenLiteralString",
//   pattern: /'/,
//   push_mode: "literal_string"
// });
//
// export const CloseLiteralString = ct.createToken({
//   name: "CloseLiteralString",
//   pattern: /'/,
//   pop_mode: true
// });
//
// export const OpenMultiLineLiteralString = ct.createToken({
//   name: "OpenMultiLineLiteralString",
//   pattern: /'''/,
//   push_mode: "multi_line_literal_string"
// });
//
// export const CloseMultiLineLiteralString = ct.createToken({
//   name: "CloseMultiLineLiteralString",
//   pattern: /'''/,
//   pop_mode: true
// });
//
// export const EscapedChar = ct.createToken({
//   name: "EscapedChar",
//   pattern: /(\\b)|(\\t)|(\\n)|(\\f)|(\\")|(\\r)|(\\\\)/
// });
//
// export const EscapedUnicode = ct.createToken({
//   name: "EscapedUnicode",
//   pattern: /(\\u([0-9A-Fa-f]{4}))|(\\U([0-9A-Fa-f]{8}))/
// });
//
// export const SubBasicString = ct.createToken({
//   name: "SubBasicString",
//   pattern: /[^\\"\r\n\u007f\u0000-\u001f]+/
// });
//
// export const SubMultiLineBasicString = ct.createToken({
//   name: "SubMultiLineBasicString",
//   pattern: /(\n|\r|[^\\"\u007f\u0000-\u001f]|"(?!""))+/
// });
//
// export const MultiLineIgnorableSubstring = ct.createToken({
//   name: "MultiLineIgnorableSubstring",
//   pattern: /\\\s*(\r\n|\n)\s*/,
//   group: ct.Lexer.SKIPPED
// });
//
// export const LiteralString = ct.createToken({
//   name: "LiteralString",
//   pattern: /[^'\n\r\u007f\u0000-\u001f]+/
// });
//
// export const MultiLineLiteralString = ct.createToken({
//   name: "MultiLineLiteralString",
//   pattern: /(\n|\r|[^'\u007f\u0000-\u001f]|'(?!''))+/
// });
//
// export const OpenArray = ct.createToken({
//   name: "OpenArray",
//   pattern: /\[/,
//   push_mode: "array"
// });
//
// export const CloseArray = ct.createToken({
//   name: "CloseArray",
//   pattern: /\]/,
//   pop_mode: true
// });
//
// export const OpenTable = ct.createToken({
//   name: "OpenTable",
//   pattern: /\[/,
//   push_mode: "table"
// });
//
// export const CloseTable = ct.createToken({
//   name: "CloseTable",
//   pattern: /\]/,
//   pop_mode: true
// });
//
// export const OpenTableArrayItem = ct.createToken({
//   name: "OpenTableArrayItem",
//   pattern: /\[\[/,
//   push_mode: "table_array_item"
// });
//
// export const CloseTableArrayItem = ct.createToken({
//   name: "CloseTableArrayItem",
//   pattern: /\]\]/,
//   pop_mode: true
// });
//
// const open_all_strings: ct.TokenType[] = [
//   OpenMultiLineBasicString,
//   OpenMultiLineLiteralString,
//   OpenBasicString,
//   OpenLiteralString
// ];
//
// const atomic_literals: ct.TokenType[] = [
//   OffsetDateTime,
//   LocalDateTime,
//   LocalDate,
//   LocalTime,
//   Float,
//   TomlInfinity,
//   TomlNotANumber,
//   BinaryInteger,
//   OctalInteger,
//   HexInteger,
//   Integer,
//   Booolean
// ];
//
// const open_identifier_strings: ct.TokenType[] = [
//   OpenBasicString,
//   OpenLiteralString
// ];
//
// const single_line_skipped: ct.TokenType[] = [ WhiteSpace, OneLineComment ];
//
// const all_skipped: ct.TokenType[] = [
//   WhiteSpace,
//   SkippedEndOfLine,
//   OneLineComment
// ];
//
// export const tomlLexerModes: ct.IMultiModeLexerDefinition = {
//   modes: {
//     top: [
//       OpenTableArrayItem,
//       OpenTable,
//       Identifier,
//       ...open_identifier_strings,
//       Dot,
//       EndOfLine,
//       ...single_line_skipped,
//       OpenValue
//     ],
//     value: [
//       ...open_all_strings,
//       ...atomic_literals,
//       ...single_line_skipped,
//       OpenArray,
//       OpenInlineTable,
//       CloseValue
//     ],
//     table: [
//       Identifier,
//       ...open_identifier_strings,
//       Dot,
//       WhiteSpace,
//       CloseTable
//     ],
//     table_array_item: [
//       Identifier,
//       ...open_identifier_strings,
//       Dot,
//       WhiteSpace,
//       CloseTableArrayItem
//     ],
//     array: [
//       ...atomic_literals,
//       ...all_skipped,
//       ...open_all_strings,
//       Comma,
//       OpenArray,
//       OpenInlineTable,
//       CloseArray
//     ],
//     inline_table: [
//       Identifier,
//       ...open_identifier_strings,
//       Dot,
//       ...single_line_skipped,
//       OpenInlineValue,
//       CloseInlineTable
//     ],
//     inline_value: [
//       ...open_all_strings,
//       ...atomic_literals,
//       ...single_line_skipped,
//       OpenArray,
//       OpenInlineTable,
//       CloseInlineValue
//     ],
//     basic_string: [
//       CloseBasicString,
//       EscapedChar,
//       EscapedUnicode,
//       SubBasicString
//     ],
//     multi_line_basic_string: [
//       CloseMultiLineBasicString,
//       EscapedChar,
//       EscapedUnicode,
//       MultiLineIgnorableSubstring,
//       SubMultiLineBasicString
//     ],
//     literal_string: [ LiteralString, CloseLiteralString ],
//     multi_line_literal_string: [
//       MultiLineLiteralString,
//       CloseMultiLineLiteralString
//     ]
//   },
//   defaultMode: "top"
// };
//
// export var tomlLexer = new ct.Lexer(tomlLexerModes);
//