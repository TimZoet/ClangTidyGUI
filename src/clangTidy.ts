import {execFile} from 'child_process';
import { readdirSync, statSync, existsSync } from 'fs';
import * as path from 'path';
import { OutputChannel, window, ProgressLocation } from 'vscode';

import * as cfg from './config';
import { getOutputFilename } from './output';

function getFiles(folder: string, recurse: boolean) : string[] {
    let filter: RegExp = RegExp(cfg.getFileFilter());///.*\.h/;
    let allFiles: string[] = [];

    readdirSync(folder).forEach((f) => {
        let file = path.join(folder, f);
        // Recurse on directory.
        if (statSync(file).isDirectory()) {
            if (recurse)    
                allFiles.push(...getFiles(file, recurse));
        }
        // Test file against filter.
        else {
            if (filter.test(f))
                allFiles.push(file);
        }
    });

    return allFiles;
}

export class ClangTidySettings
{
    constructor(
        public readonly exe: string,
        public readonly build: string,
        public readonly output: string,
        public readonly channel: OutputChannel,
        public readonly checks: string
    ) {
    }
}

/**
 * Runs exec file
 * @param settings 
 * @param sourceFile Full path to the source file.
 * @param outputFile Full path to the output file.
 * @returns  
 */
function runExecFile(settings: ClangTidySettings, sourceFile: string, outputFile: string) {
    return new Promise((resolve, reject) => {
        let args = [];
        args.push(settings.checks);
        args.push('-p');
        args.push(settings.build);
        args.push(`-export-fixes=${outputFile}`);
        const extraArgs = cfg.getExtraArguments();
        if (extraArgs.length > 0)
            args.push(`-extra-arg="${cfg.getExtraArguments()}"`);
        args.push(sourceFile);

        let child = execFile(settings.exe, args, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            }
            resolve();
         });
 
         child.on('error', reject).on('close', (code) => {
             if (code === 0) {
                resolve();
             }
             else {
                reject(code);
             }
         });
    });
}

export function clangTidyFile(settings: ClangTidySettings, sourceFile: string) : Promise<string>
{
    return new Promise(async (resolve, reject) => {
        // Output filename is hash of source filename.
        const outputFile = path.join(settings.output, getOutputFilename(sourceFile));

        settings.channel.appendLine(`[${new Date().toISOString()}] Running clang-tidy on ${sourceFile}`);

        await runExecFile(settings, sourceFile, outputFile).then(() => {
            // If clang-tidy did not find any errors, it will not output a file.
            if (existsSync(outputFile)) {
                settings.channel.appendLine(`[${new Date().toISOString()}] Writing results for ${sourceFile} to ${outputFile}`);
                resolve(outputFile);
            }
            else {
                settings.channel.appendLine(`[${new Date().toISOString()}] No problems found for ${sourceFile}`);
                resolve('');
            }
        }).catch((error) => {
            settings.channel.appendLine(`[${new Date().toISOString()}] An error occurred when running clang-tidy on ${sourceFile}:\n${error}`);
            resolve('');
        })
    });
}

export function clangTidyFolder(settings: ClangTidySettings, folder: string, recursive: boolean): Promise<string[]> {
    return new Promise((resolve, reject) => {
        window.withProgress({
            location: ProgressLocation.Notification,
            title: `Running clang-tidy on ${folder}`,
            cancellable: true
        }, async (progress, token) => {
            token.onCancellationRequested(() => {
                settings.channel.appendLine('Cancelled clang-tidy');
            });

            const taskCount = cfg.getParallelTasks();
            const files = getFiles(folder, recursive);
            let outputFiles: string[] = [];
            let tasks: Promise<void>[] = [];
            const inc = 100.0 / files.length;

            for (const file of files) {
                const task = clangTidyFile(settings, file).then((outputFile: string) => {
                    // If clang-tidy ran successfully, the outputFile is a non-empty string.
                    if (outputFile.length > 0) {
                        outputFiles.push(outputFile);
                    }

                    // Remove task from list.
                    const i = tasks.indexOf(task);
                    tasks.splice(i, 1);

                    progress.report({ increment: inc });
                });

                tasks.push(task);

                // Tasklist is full, wait.
                if (tasks.length >= taskCount) {
                    await Promise.race(tasks);
                }
            }

            // Wait for remaining tasks.
            await Promise.all(tasks);
            resolve(outputFiles);
        });
    });
}
