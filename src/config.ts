import { cpus } from 'os';
import { join } from 'path';
import { commands, workspace } from 'vscode';

function getConfig() {
    return workspace.getConfiguration('clangtidy');
}

function substituteWorkspaceFolder(path: string) {
    // Make path relative to workspace.
    if (path.startsWith('${workspaceFolder}')) {
        return join(workspace.workspaceFolders![0].uri.fsPath, path.substr(18, path.length - 18));
    }

    return path;
}

async function substituteAsyncVars(path: string) : Promise<string> {
    // Substitute workspace folder.
    path = substituteWorkspaceFolder(path);

    // Substitute configuration name using cpptools command.
    if (path.indexOf('${cpptools.config}') >= 0) {
        path = await commands.executeCommand('cpptools.activeConfigName').then(
            (name) => { return path.replace('${cpptools.config}', <string>name); },
            () => { return path; }
        );
    }
    
    return path;
}

export async function getParallelTasks() : Promise<Number> {
    const tasks = <Number>getConfig().get('parallelTasks');

    // Negative value, default to 1.
    if (tasks < 0) {
        return 1;
    }
    
    // 0, return core count.
    if (tasks === 0) {
        return cpus().length;
    }

    // Explicit value.
    return tasks;
}

export async function getClangTidyExecutable() : Promise<string> {
    const folder = <string>getConfig().get('executablePath');
    return substituteAsyncVars(folder);
}

export async function getBuildFolder() : Promise<string> {
    const folder = <string>getConfig().get('buildPath');
    return substituteAsyncVars(folder);
}

export async function getChecksFolder() : Promise<string> {
    const folder = <string>getConfig().get('checksPath');
    return substituteAsyncVars(folder);
}

export async function getOutputFolder() : Promise<string> {
    const folder = <string>getConfig().get('outputPath');
    return substituteAsyncVars(folder);
}

export function getSourceFolder() : string {
    // Split string on , and ;.
    const folders = (<string>getConfig().get('sourcePath')).replace(',', ';').split(';');
    const rootFolder = substituteWorkspaceFolder(folders[0]);
    return rootFolder;
}

export async function getSourceSubFolders() : Promise<string[]> {
    // Split string on , and ;.
    const folders = (<string>getConfig().get('sourcePath')).replace(',', ';').split(';');
    const rootFolder = await substituteAsyncVars(folders[0]);
    const subFolders = folders.slice(1).filter(f => f.length > 0).map(f => join(rootFolder, f));
    if (subFolders.length === 0) {
        return [rootFolder];
    }
    return subFolders;
}

export function getFileFilter() : string {
    return <string>getConfig().get('fileFilter');
}

export function getExtraArguments() : string {
    return <string>getConfig().get('extraArguments');
}