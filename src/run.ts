import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

import * as run from './clangTidy';
import * as cfg from './config';
import * as parser from './parser';
import { DiagnosticsTreeView } from './tree/diagnosticsTreeView'

/**
 * Add the diagnostics of a single file to the tree.
 * @param file Full path to YAML file.
 */
export function addFileToTree(tree: DiagnosticsTreeView, file: string) {
    tree.add(file, parser.parseFile(file));
}

/**
 * Add the diagnostics of all analyzed files to the tree.
 */
export function addOutputFolderToTree(tree: DiagnosticsTreeView) {
    const out = cfg.getOutputFolder();
    const files = fs.readdirSync(out).filter(f => { return path.extname(f) == '.yaml' });
    for (const f of files) {
        addFileToTree(tree, path.join(out, f));
    }
}

/**
 * Run clang-tidy on the given source file and add results to tree.
 * @param tree TreeView.
 * @param sourceFile Full path to source file.
 */
export async function runFile(tree: DiagnosticsTreeView, sourceFile: string, checks: string, channel: vscode.OutputChannel) {
    const settings = new run.ClangTidySettings(cfg.getClangTidyExecutable(), cfg.getBuildFolder(), cfg.getOutputFolder(), channel, checks);

    // Create output directory.
    fs.mkdirSync(settings.output, { recursive: true });

    run.clangTidyFile(settings, sourceFile).then((outputFile: string) => {
        if (outputFile.length > 0) {
            addFileToTree(tree, outputFile);
        }
    }).catch(reason => { 
        channel.append(`Failed to run clang-tidy on file ${sourceFile}. Error message: ${reason}`);
    });
}

/**
 * 
 * @param folder 
 * @param tree TreeView.
 * @param recursive 
 */
export async function runFolder(tree: DiagnosticsTreeView, folder: string, recursive: boolean, checks: string, channel: vscode.OutputChannel) {
    const settings = new run.ClangTidySettings(cfg.getClangTidyExecutable(), cfg.getBuildFolder(), cfg.getOutputFolder(), channel, checks);

    // Create output directory.
    fs.mkdirSync(settings.output, { recursive: true });

    await run.clangTidyFolder(settings, folder, recursive).then((outputFiles: string[]) => {
        outputFiles.forEach(file => {
            if (file.length > 0) {
                addFileToTree(tree, file);
            }
        });
    }).catch(reason => { 
        channel.appendLine(`Failed to run clang-tidy on folder ${folder}. Error message: ${reason}`);
    });
}