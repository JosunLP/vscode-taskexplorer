
export interface ITeFilesystem
{
    appendFileSync(file: string, data: string): void;
    copyDir(src: string, dst: string, filter?: RegExp, copyWithBaseFolder?: boolean): Promise<boolean>;
    copyFile(src: string, dst: string): Promise<void>;
    createDir(dir: string): Promise<void>;
    createDirSync(dir: string): void;
    deleteDir(dir: string): Promise<void>;
    deleteFile(file: string): Promise<void>;
    deleteFileSync(file: string): void;
    isDirectory(dirPath: string): boolean;
    getDateModified(file: string): Promise<number>;
    getDateModifiedSync(file: string): number;
    numFilesInDirectory(dirPath: string): Promise<number>;
    pathExists(file: string): Promise<boolean>;
    pathExistsSync (file: string): boolean;
    readFileAsync(file: string): Promise<string>;
    readFileSync(file: string): string;
    readJsonAsync<T>(file: string): Promise<T>;
    readJsonSync<T>(file: string): T;
    writeFile(file: string, data: string): Promise<void>;
    writeFileSync(file: string, data: string): void;
}
