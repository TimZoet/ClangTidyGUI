import { execFile } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

import * as cfg from './config';

export type Checks = {[k: string]: any};

/**
 * Load the checks file, or create it with all diagnostics enabled if it does not exist.
 */
export async function loadChecksFile(): Promise<Checks> {
    return new Promise(async (resolve, reject) => {
        const checksFolder = await cfg.getChecksFolder();
        const checksFile = path.join(checksFolder, 'checks.json');
    
        if (!fs.existsSync(checksFile)) {
            // Ask clang-tidy to list all available checks.
            const exe = await cfg.getClangTidyExecutable();
            execFile(exe, ['-checks=*', '-list-checks'], async (error, stdout, stderr) => {
                if (error) {
                    vscode.window.showErrorMessage(`Clang Tidy: Could not create file ${checksFile}`);
                    reject();
                }

                let checks: Checks = {};
                checks['enabled'] = true;
                checks['categories'] = {};
    
                // Split by newline and remove whitespace.
                const lines = stdout.split(/\r?\n/).map(c => c.trim());
    
                // Loop over all but first and last lines.
                lines.slice(1, lines.length - 2).forEach(c => {
                    const i = c.indexOf('-');
                    const category = c.slice(0, i);
    
                    // Create new category.
                    if (!(category in checks['categories'])) {
                        checks['categories'][category] = { 'enabled': true, 'issues': {} };
                    }
    
                    // Create new issue type.
                    checks['categories'][category]['issues'][c] = true;
                });

                await saveChecks(checks);
                resolve(checks);
            });
        }
        else {
            // Load file.
            resolve(<Checks>JSON.parse(fs.readFileSync(checksFile, 'utf8')));
        }
    });
}

export async function saveChecks(checks: Checks) {
    const checksFolder = await cfg.getChecksFolder();
    const checksFile = path.join(checksFolder, 'checks.json');
    fs.writeFileSync(checksFile, JSON.stringify(checks));
}

/**
 * Convert the object with checks to the string that is passed to clang-tidy.
 * @param checks 
 * @returns 
 */
export function checksToString(checks: Checks): string {
    const allEnabled: boolean = checks['enabled'];

    let str: string = `--checks=${allEnabled ? '*' : '-*'}`;

    Object.keys(checks['categories']).forEach(cat => {
        const catEnabled = checks['categories'][cat]['enabled'];

        // If category enabled state is different from all, append either 'category-*' or '-category-*'.
        if (catEnabled !== allEnabled) {
            str += `,${catEnabled ? '' : '-'}${cat}-*`;
        }

        Object.keys(checks['categories'][cat]['issues']).forEach(i => {
            const issueEnabled: boolean = checks['categories'][cat]['issues'][i];

            // If issue enabled state is different from category, append either 'issue' or '-issue'.
            if (issueEnabled !== catEnabled) {
                str += `,${issueEnabled ? '' : '-'}${i}`;
            }
        });
    });

    return str;
}