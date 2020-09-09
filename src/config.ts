import { cpus } from 'os';
import { join } from 'path';
import { workspace } from 'vscode';

function getConfig() {
    return workspace.getConfiguration('clangtidy');
}

function convertWorkspaceFolder(folder: string) {
    // Make path relative to workspace.
    if (folder.startsWith('${workspaceFolder}'))
        return join(workspace.workspaceFolders![0].uri.fsPath, folder.substr(18, folder.length - 18));

    return folder;
}

export function getParallelTasks() : Number {
    const tasks = <Number>getConfig().get('parallelTasks');

    // Negative value, default to 1.
    if (tasks < 0)
        return 1;
    
    // 0, return core count.
    if (tasks == 0)
        return cpus().length;

    // Explicit value.
    return tasks;
}

export function getClangTidyExecutable() : string {
    return <string>getConfig().get('executablePath');
}

export function getBuildFolder() : string {
    const folder = <string>getConfig().get('buildPath');
    return convertWorkspaceFolder(folder);
}

export function getOutputFolder() : string {
    const folder = <string>getConfig().get('outputPath');
    return convertWorkspaceFolder(folder);
}

export function getSourceFolder() : string {
    const folder = <string>getConfig().get('sourcePath');
    return convertWorkspaceFolder(folder);
}

export function getFileFilter() : string {
    return <string>getConfig().get('fileFilter');
}