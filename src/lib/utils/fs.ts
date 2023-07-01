/**
 * @module fs
 *
 * @since 3.0.0
 *
 * Promisified set of base fs module functions
 *
 */

import * as fs from "fs";
import { glob } from "glob";
import * as path from "path";
import { wrap } from "./utils";

const cwd = process.cwd();

/*
export const appendFile = (file: string, data: string): Promise<void> =>
{
    return new Promise<void>((resolve, reject) =>
    {
        fs.appendFile(path.resolve(cwd, file), data, (e) => handleTResult<void>(resolve, reject, e));
    });
};
*/

export const appendFileSync = (file: string, data: string): void => { try { fs.appendFileSync(path.resolve(cwd, file), data); } catch {}};


//
// TODO - 'copyDir' and 'copyFile' are only used in tests.  If ever used in the application,
//        remove all istanbul ignore tags and cover these functions 100%
//
export const copyDir = (src: string, dst: string, filter?: RegExp, copyWithBaseFolder = false) =>
{
    return new Promise<boolean>(async (resolve, reject) =>
    {
        const srcDir = path.resolve(cwd, src);
        if (!await pathExists(srcDir)) {
            reject(new Error("Invalid source directory path"));
            return;
        }

        if (!fs.lstatSync(srcDir).isDirectory()) {
            resolve(false);
            return;
        }
        //
        // Check if folder needs to be created or merged
        //
        let tgtDir;
        if (!copyWithBaseFolder) {
            tgtDir = path.resolve(cwd, dst);
        }
        else {
            tgtDir = path.join(path.resolve(cwd, dst), path.basename(src));
        }
        if (!await pathExists(tgtDir))
        {
            try { await createDir(tgtDir); } catch (e){ /* istanbul ignore next */reject(e); /* istanbul ignore next */return; };
        }
        //
        // Copy
        //
        const files = fs.readdirSync(srcDir);
        for (const file of files)
        {
            const newSrc = path.join(srcDir, file);
            if (fs.existsSync(newSrc) && fs.lstatSync(newSrc).isDirectory())
            {
                await copyDir(newSrc, tgtDir, filter, true);
            }
            else {
                if (filter)
                {
                    if (filter.test(newSrc)) {
                        await copyFile(newSrc, tgtDir);
                    }
                }
                else {
                    await copyFile(newSrc, tgtDir);
                }
            }
        }

        resolve(true);
    });
};


//
// TODO - 'copyDir' and 'copyFile' are only used in tests.  If ever used in the application,
//        remove all istanbul ignore tags and cover these functions 100%
//
export const copyFile = (src: string, dst: string) =>
{
    return new Promise<void>(async (resolve, reject) =>
    {
        const srcFile = path.resolve(cwd, src);
        if (!await pathExists(srcFile)) {
            reject(new Error("Invalid source file path"));
        }
        //
        // If dst is a directory, a new file with the same name will be created
        //
        let fullPath = path.resolve(cwd, dst);
        if (await pathExists(fullPath))
        {
            if (fs.lstatSync(fullPath).isDirectory()) {
                fullPath = path.join(fullPath, path.basename(src));
            }
        }
        fs.copyFile(srcFile, fullPath, (err) =>
        {
            /* istanbul ignore if */
            if (err) {
                reject(err);
            }
            resolve();
        });
    });
};


export const createDir = (dir: string): Promise<void> =>
{
    return wrap(async () =>
    {
        const newDir = path.resolve(cwd, dir);
        if (!pathExistsSync(newDir))
        {
            const baseDir = path.dirname(dir);
            await createDir(baseDir);
            await new Promise((resolve, reject) => {
                fs.mkdir(path.resolve(cwd, dir), { mode: 0o777 }, (e) => handleTResult<void>(resolve, reject, e));
            });
        }
    }, null, this);
};


export const deleteDir = (dir: string): Promise<void> =>
{
    return new Promise<void>(async (resolve, reject) =>
    {
        const absPath = path.resolve(cwd, dir);
        if (pathExistsSync(absPath))
        {
            fs.rmdir(absPath, { recursive: true }, (e) => handleTResult<void>(resolve, reject, e));
        }
        else {
            resolve();
        }
    });
};


export const deleteFile = (file: string): Promise<void> =>
{
    return new Promise<void>(async (resolve, reject) =>
    {
        if (pathExistsSync(file))
        {
            fs.unlink(path.resolve(cwd, file), (e) => handleTResult<void>(resolve, reject, e));
        }
        else {
            resolve();
        }
    });
};


/**
 * @method findFiles
 * @since 3.0.0
 */
export const findFiles = (pattern: string, options: any): Promise<string[]> =>
{
    return new Promise((resolve, reject) =>
    {
        glob(pattern, options, (err, files) =>
        {
            /* istanbul ignore else */
            if (!err) {
                resolve(files);
            }
            else {
                reject(err);
            }
        });
    });
};



export const getDateModified = (file: string) =>
{
    return new Promise<Date|undefined>(async (resolve, reject) =>
    {
        if (file && await pathExists(file))
        {
            fs.stat(path.resolve(cwd, file), { bigint: true }, (e, stats) =>
            {
                /* istanbul ignore if */
                if (e) {
                    reject(e);
                }
                resolve(stats.mtime);
            });
        }
        else {
            resolve(undefined);
        }
    });
};


export const getDateModifiedSync = (file: string) =>
{
    try {
        if (file && pathExistsSync(file)) {
            return fs.statSync(path.resolve(cwd, file), { bigint: true }).mtime.getTime();
        }
    } catch {}
    return 0;
};


const handleBooleanResult = (res: (res: boolean) => void, e: any) => { if (!e) res(true); else res(false); };
const handleTResult = <T>(res: (res: T | PromiseLike<T>) => void, rej: (e: any) => void, e: any, data?: T) => { if (!e) res(data as T); else rej(e); };


export const isDirectory = (dirPath: string) => pathExistsSync(dirPath) && fs.lstatSync(dirPath).isDirectory();


export const numFilesInDirectory = (dirPath: string) =>
{
    return new Promise<number>((resolve) =>
    {
        if (dirPath && pathExistsSync(dirPath))
        {
            fs.readdir(dirPath, (err, files) =>
            {
                /* istanbul ignore else */
                if (!err) {
                    resolve(files.length);
                }
                else resolve(0);
            });
        }
        else { resolve(0); /* (new Error("Invalid directory does not exist"));*/ }
    });
};


export const pathExists = (file: string) =>
{
    return new Promise<boolean>((resolve) =>
    {
        fs.access(path.resolve(cwd, file), e => handleBooleanResult(resolve, e));
    });
};


export const pathExistsSync = (file: string) =>
{
    try {
        fs.accessSync(path.resolve(cwd, file));
    }
    catch {
        return false;
    }
    return true;
};


export const readFileAsync = (file: string): Promise<string> =>
{
    return new Promise<string>(async (resolve, reject) =>
    {
        try {
            const buf = await readFileBufAsync(file);
            resolve(buf.toString("utf8"));
        }
        catch (e) { reject(e); }
    });
};


export const readFileSync = (file: string) =>
{
    try {
        return fs.readFileSync(path.resolve(process.cwd(), file)).toString();
    }
    catch { return ""; }
};


export const readJsonAsync = <T>(file: string): Promise<T> =>
{
    return new Promise<T>(async (resolve, reject) =>
    {
        try {
            const json = await readFileAsync(file),
                  jso = JSON.parse(json);
            resolve(jso);
        }
        catch (e) { reject(e); }
    });
};


export const readJsonSync = <T>(file: string): T =>
{
    try {
        const json = fs.readFileSync(path.resolve(process.cwd(), file)).toString(),
              jso = JSON.parse(json);
        return jso;
    }
    catch { return {} as T; }
};


const readFileBufAsync = (file: string): Promise<Buffer> =>
{
    return new Promise<Buffer>(async (resolve, reject) =>
    {
        fs.readFile(path.resolve(cwd, file), (e, data) => handleTResult<Buffer>(resolve, reject, e, data));
    });
};

/*
export const renameFile = (fileCurrent: string, fileNew: string): Promise<void> =>
{
    return new Promise<void>(async (resolve, reject) =>
    {
        if (await pathExists(fileCurrent))
        {
            fs.rename(path.resolve(cwd, fileCurrent), path.resolve(cwd, fileNew), (e) => handleTResult<void>(resolve, reject, e));
        }
        else {
            reject(new Error("Invalid source file path"));
        }
    });
};
*/

// /**
//  * Replace text in a file, for use with version # replacement
//  *
//  * @param file The file
//  * @param old Text or regex pattern to replace
//  * @param nu Text to insert in place of 'old'
//  * @param caseSensitive `true` to make the replacement case sensitive
//  */
// export async function replaceInFile(file: string, old: string, nu: string | ((m: RegExpExecArray) => string), caseSensitive = true)
// {
//     if (await pathExists(file))
//     {
//         let contentNew: string | undefined;
//         const content = await readFile(file),
//               regex = new RegExp(old, caseSensitive ? "gm" : "gmi");
//
//         if (isString(nu))
//         {
//             if (caseSensitive) {
//                 contentNew = content.replace(regex, nu);
//             }
//             else {
//                 contentNew = content.replace(new RegExp(regex, "i"), nu);
//             }
//         }
//         else
//         {
//             let match: RegExpExecArray | null;
//             while ((match = regex.exec(content)) !== null) {
//                 contentNew = content.replace(new RegExp(old, caseSensitive ? "gm" : "gmi"), nu(match));
//             }
//         }
//
//         if (contentNew && content !== contentNew)
//         {
//             await writeFile(file, contentNew);
//             return true;
//         }
//     }
//
//     return false;
// }
//
//
// export function setCwd(dir: string)
// {
//     cwd = dir;
// }
//
//
/**
 * Overwrites file if it exists
 *
 * @param file The file path to write to
 * @param data The data to write
 */
export const writeFile = (file: string, data: string): Promise<void> =>
{
    return new Promise<void>((resolve, reject) =>
    {
        if (!isDirectory(file))
        {
            fs.writeFile(path.resolve(cwd, file), data, (e) => handleTResult<void>(resolve, reject, e));
        }
        else {
            reject(new Error("Specified path is a directory"));
        }
    });
};


export const writeFileSync = (file: string, data: string): void => { if (!isDirectory(file)) fs.writeFileSync(path.resolve(cwd, file), data); };

/*
export const afs: ITeFilesystem =
{
    copyDir,
    copyFile,
    createDir,
    deleteDir,
    deleteFile,
    isDirectory,
    getDateModified,
    numFilesInDirectory,
    pathExists,
    pathExistsSync,
    readFileAsync,
    readFileSync,
    readJsonAsync,
    readJsonSync,
    writeFile,
    writeFileSync
};
*/
