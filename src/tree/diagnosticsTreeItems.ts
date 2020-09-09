import * as path from 'path';
import * as vscode from 'vscode';

import * as cfg from '../config';
import { Diagnostic } from '../diagnostic';

export class FilterTreeItem extends vscode.TreeItem {
    constructor(
        label: string,
        collapsibleState?: vscode.TreeItemCollapsibleState,
        public parent?: FilterTreeItem
    ) {
        super(label, collapsibleState);
    }

    filter(ds: Diagnostic[]): Diagnostic[] {
        return ds;
    }

    getCategories(ds: Diagnostic[]): CategoryTreeItem[] {
        // Filter diagnostics and then get all unique categories.
        const items = Array.from(new Set(this.filter(ds).map(d => d.category))).sort().map(c => new CategoryTreeItem(this, c));
        return items;
    }

    getFiles(ds: Diagnostic[]): FileTreeItem[] {
        // Filter diagnostics and then get all unique files.
        const items = Array.from(new Set(this.filter(ds).map(d => d.sourceFile))).sort().map(f => new FileTreeItem(this, f));
        return items;
    }

    getIssueTypes(ds: Diagnostic[]): IssueTypeTreeItem[] {
        // Filter diagnostics and then get all unique issue types.
        const items = Array.from(new Set(this.filter(ds).map(i => i.issue))).sort().map(i => new IssueTypeTreeItem(this, i));
        return items;
    }

    getDiagnostics(ds: Diagnostic[]): DiagnosticTreeItem[] {
        // Filter diagnostics and then get all issues.
        const items = this.filter(ds).sort((a, b) => {
            return Math.sign(a.offset - b.offset);
        }).map(d => new DiagnosticTreeItem(this, d));
        return items;
    }

    get depth(): number {
        return this.parent ? (this.parent.depth + 1) : 0;
    }
}

/**
 * The FileTreeItem represents a group of diagnostics in the same source file.
 */
export class FileTreeItem extends FilterTreeItem {
    contextValue = 'file';
    iconPath = new vscode.ThemeIcon('file-code');

    constructor(
        public parent: FilterTreeItem,
        public sourceFile: string
    ) {
        super(path.relative(cfg.getSourceFolder(), sourceFile), vscode.TreeItemCollapsibleState.Expanded, parent);
    }

    filter(ds: Diagnostic[]): Diagnostic[] {
        return this.parent.filter(ds).filter(d => d.sourceFile === this.sourceFile);
    }
}

/**
 * The CategoryTreeItem represents a group of diagnostics of the same category.
 */
export class CategoryTreeItem extends FilterTreeItem {
    contextValue = 'diagnosticCategory';
    iconPath = new vscode.ThemeIcon('folder-opened');

    constructor(
        public parent: FilterTreeItem,
        public category: string
    ) {
        super(category, vscode.TreeItemCollapsibleState.Expanded, parent);
    }

    filter(ds: Diagnostic[]): Diagnostic[] {
        return this.parent.filter(ds).filter(d => d.category === this.category);
    }
}

/**
 * The IssueTypeTreeItem represents a group of diagnostics of the same type.
 */
export class IssueTypeTreeItem extends FilterTreeItem {
    iconPath = new vscode.ThemeIcon('error');

    constructor(
        public parent: FilterTreeItem,
        public issue: string
    ) {
        super(issue, vscode.TreeItemCollapsibleState.Expanded, parent);
    }

    filter(ds: Diagnostic[]): Diagnostic[] {
        return this.parent.filter(ds).filter(d => d.issue === this.issue);
    }
}

/**
 * The DiagnosticTreeItem represents one clang-tidy diagnostic.
 */
export class DiagnosticTreeItem extends vscode.TreeItem {
    contextValue = 'diagnostic';
    
    constructor(
        public parent: FilterTreeItem,
        public diagnostic: Diagnostic
    ) {
        super(`${diagnostic.message[0].toUpperCase()}${diagnostic.message.slice(1)}.`);
        this.command = {
            command: 'clangtidy.viewDiagnostic',
            title: 'View in File',
            arguments: [diagnostic.sourceFile, diagnostic.offset]
         };
    }
  
    tooltip = this.diagnostic.message;
    iconPath = new vscode.ThemeIcon('record');
}