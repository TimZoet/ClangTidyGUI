import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

import * as cfg from './config';

/**
 * Create the output folder.
 */
export function createOutputFolder() {
    if (!fs.existsSync(cfg.getOutputFolder())) {
        fs.mkdirSync(cfg.getOutputFolder(), { recursive: true });
    }
}

/**
 * Remove all YAML files from the output folder.
 */
export function clearOutputFolder() {
    const out = cfg.getOutputFolder();
    fs.readdirSync(out).filter(f => path.extname(f) === '.yaml').forEach(f => fs.unlinkSync(path.join(out, f)));
}

/**
 * Get the YAML output filename of a source file.
 * @param sourceFile Full path to source file.
 */
export function getOutputFilename(sourceFile: string): string {
    return createHash('md5').update(sourceFile).digest('hex').concat('.yaml')
}