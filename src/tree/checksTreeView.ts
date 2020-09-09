import * as vscode from 'vscode';

import { Checks } from '../checks';
import { ChecksTreeItem, ChecksCategoryTreeItem, ChecksIssueTreeItem } from './checksTreeItems';

export class ChecksTreeView implements vscode.TreeDataProvider<vscode.TreeItem> {
    _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | null> = new vscode.EventEmitter<vscode.TreeItem | null>();
    onDidChangeTreeData: vscode.Event<vscode.TreeItem | null> = this._onDidChangeTreeData.event;

    private checks: Checks = {};
    private rootTreeItem: ChecksTreeItem;

    constructor() {
        this.rootTreeItem = new ChecksTreeItem(false, 'All', vscode.TreeItemCollapsibleState.Collapsed);
    }

    getChildren(parent?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
        if (parent) {
            // Get check categories.
            if (parent instanceof ChecksTreeItem) {
                return Promise.resolve(this.getChecksCategoryTreeItems());
            }

            // Get check issues.
            if (parent instanceof ChecksCategoryTreeItem) {
                return Promise.resolve(this.getChecksIssueTreeItems(parent));
            }

            return Promise.resolve([]);
        }
        
        // Get root items.
        return Promise.resolve([this.rootTreeItem]);
    }
    
    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    setChecks(checks: Checks) {
        this.checks = checks;
        this.rootTreeItem.setEnabled(checks['enabled']);
        this._onDidChangeTreeData.fire(this.rootTreeItem);
    }

    private getChecksCategoryTreeItems(): ChecksCategoryTreeItem[] {
        return Object.keys(this.checks['categories']).map(
            cat => new ChecksCategoryTreeItem(
                this.checks['categories'][cat]['enabled'], 
                cat, 
                vscode.TreeItemCollapsibleState.Collapsed
            )
        );
    }

    private getChecksIssueTreeItems(parent: ChecksCategoryTreeItem): ChecksIssueTreeItem[] {
        return Object.keys(this.checks['categories'][parent.label!]['issues']).map(
            issue => new ChecksIssueTreeItem(
                this.checks['categories'][parent.label!]['issues'][issue], 
                issue, 
                vscode.TreeItemCollapsibleState.None
            )
        );
    }
}