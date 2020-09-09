import * as vscode from 'vscode';

import { Diagnostic } from '../diagnostic';
import { CategoryTreeItem, DiagnosticTreeItem, FileTreeItem, FilterTreeItem, IssueTypeTreeItem } from './diagnosticsTreeItems';

export enum SortingType {
    Category = 'Category',
    CategoryFile = 'Category/File',
    CategoryFileIssue = 'Category/File/Issue',
    File = 'File',
    FileCategory = 'File/Category',
    FileCategoryIssue = 'File/Category/Issue',
    FileIssue = 'File/Issue',
    Issue = 'Issue',
    IssueFile = 'Issue/File'
}

export class DiagnosticsTreeView implements vscode.TreeDataProvider<vscode.TreeItem> {
    _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | null> = new vscode.EventEmitter<vscode.TreeItem | null>();
    onDidChangeTreeData: vscode.Event<vscode.TreeItem | null> = this._onDidChangeTreeData.event;

    private sortType : SortingType = SortingType.FileCategoryIssue;
    private diagnostics: Record<string, Diagnostic[]> = {};
    private filters : { (issues: Diagnostic[], f: FilterTreeItem): vscode.TreeItem[]; }[] = [];
    private rootTreeItem: FilterTreeItem;

    constructor() {
        this.rootTreeItem = new FilterTreeItem('Diagnostics', vscode.TreeItemCollapsibleState.Collapsed);
        this.setSortingType(SortingType.FileCategoryIssue);
    }

    getChildren(parent?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
        if (parent) {
            if (parent instanceof FilterTreeItem) {
                let ds: Diagnostic[] = [];
                for (const file of Object.keys(this.diagnostics)) {
                    ds.push(...this.diagnostics[file]);
                }
                return Promise.resolve(this.filters[parent.depth](ds, parent));
            }

            return Promise.resolve([]);
        }

        return Promise.resolve([this.rootTreeItem]);
    }
    
    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    /**
     * Clear the list of diagnostics and tree view.
     */
    clear() {
        this.diagnostics = {};
        this._onDidChangeTreeData.fire(null);
    }

    /**
     * Add new diagnostics to the tree. Clears previous diagnostics for the file.
     * @parem file File diagnostics are for.
     * @param diagnostics List of diagnostics.
     */
    add(file: string, diagnostics: Diagnostic[]) {
        this.diagnostics[file] = diagnostics;
        this._onDidChangeTreeData.fire(this.rootTreeItem);
    }

    setSortingType(sorting: SortingType) {
        this.sortType = sorting;

        switch (this.sortType) {
            case SortingType.Category:
                this.filters = [this.getCategoryTreeItems];
                break;
            case SortingType.CategoryFile:
                this.filters = [this.getCategoryTreeItems, this.getFileTreeItems];
                break;
            case SortingType.CategoryFileIssue:
                this.filters = [this.getCategoryTreeItems, this.getFileTreeItems, this.getIssueTypeTreeItems];
                break;
            case SortingType.File:
                this.filters = [this.getFileTreeItems];
                break;
            case SortingType.FileCategory:
                this.filters = [this.getFileTreeItems, this.getCategoryTreeItems];
                break;
            case SortingType.FileCategoryIssue:
                this.filters = [this.getFileTreeItems, this.getCategoryTreeItems, this.getIssueTypeTreeItems];
                break;
            case SortingType.FileIssue:
                this.filters = [this.getFileTreeItems, this.getIssueTypeTreeItems];
                break;
            case SortingType.Issue:
                this.filters = [this.getIssueTypeTreeItems];
                break;
            case SortingType.IssueFile:
                this.filters = [this.getIssueTypeTreeItems, this.getFileTreeItems];
                break;
        }

        this.filters.push(this.getDiagnosticTreeItems);

        this._onDidChangeTreeData.fire(this.rootTreeItem);
    }

    private getCategoryTreeItems(ds: Diagnostic[], filter: FilterTreeItem): CategoryTreeItem[] {
        return filter.getCategories(ds);
    }

    private getFileTreeItems(ds: Diagnostic[], filter: FilterTreeItem): FileTreeItem[] {
        return filter.getFiles(ds);
    }

    private getIssueTypeTreeItems(ds: Diagnostic[], filter: FilterTreeItem): IssueTypeTreeItem[] {
        return filter.getIssueTypes(ds);
    }

    private getDiagnosticTreeItems(ds: Diagnostic[], filter: FilterTreeItem): DiagnosticTreeItem[] {
        return filter.getDiagnostics(ds);
    }
}