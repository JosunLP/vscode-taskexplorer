
import { join, resolve } from "path";
import { existsSync, mkdirSync } from "fs";
import { Uri, WorkspaceFolder } from "vscode";

const _projectPath = resolve(__dirname, "..", "..", "..");

const testsProjectsDir = join(_projectPath, ".vscode-test", "user-data", "projects");
if (!existsSync(testsProjectsDir)) {
    mkdirSync(testsProjectsDir);
}

export const getWsPath = (p: string) => join(_projectPath, "test-fixture", "project1", p);


export const getProjectsPath = (p: string) => join(testsProjectsDir, p);


export const getDevPath = (p: string) => join(_projectPath, p);


export const getRelativePath = (folder: WorkspaceFolder, uri: Uri): string =>
{
    const rootUri = folder.uri;
    const absolutePath = uri.path.substring(0, uri.path.lastIndexOf("/") + 1);
    return absolutePath.substring(rootUri.path.length + 1);
};
