import { readFileSync } from 'fs';
import { Diagnostic } from './diagnostic';

export function getCategory(issue: string): string {
    const i = issue.indexOf('-');
    return issue.slice(0, i);
}

function* parseYAML(file: string) {
    const yaml = require('js-yaml');
    const str = readFileSync(file, 'utf8');
    const doc = yaml.safeLoad(str);
    const sourceFile = doc['MainSourceFile'];

    for (const d of doc['Diagnostics']) {
        const issue: string = d['DiagnosticName'];
        const offset: number = d['DiagnosticMessage']['FileOffset'];
        const message: string = d['DiagnosticMessage']['Message'];
        const line = 0;
        yield new Diagnostic(sourceFile, getCategory(issue), issue, offset, line, message);
    }
}

/**
 * Parse a YAML file containing clang-tidy results.
 * @param file Full path to YAML file.
 * @returns List of diagnostics.
 */
export function parseFile(file: string): Diagnostic[] {
    return Array.from(parseYAML(file));
}