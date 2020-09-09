import * as vscode from 'vscode';

export class ChecksTreeItem extends vscode.TreeItem {
    contextValue = 'checksAll';

    constructor(
        private enabled: boolean,
        label: string,
        collapsibleState?: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
        this.setEnabled(enabled);
    }

    setEnabled(enabled: boolean) {
        this.iconPath = new vscode.ThemeIcon(enabled ? 'check' : 'close');
    }
}

export class ChecksCategoryTreeItem extends vscode.TreeItem {
    contextValue = 'checksCategory';

    constructor(
        private enabled: boolean,
        public category: string,
        collapsibleState?: vscode.TreeItemCollapsibleState
    ) {
        super(category, collapsibleState);
        this.iconPath = new vscode.ThemeIcon(enabled ? 'check' : 'close');
    }
}

export class ChecksIssueTreeItem extends vscode.TreeItem {
    contextValue = 'checksIssue';

    constructor(
        private enabled: boolean,
        public issue: string,
        collapsibleState?: vscode.TreeItemCollapsibleState
    ) {
        super(issue, collapsibleState);
        this.iconPath = new vscode.ThemeIcon(enabled ? 'check' : 'close');
    }
}