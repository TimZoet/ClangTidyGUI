import * as vscode from 'vscode';

export class CommandTreeItem extends vscode.TreeItem {
    command: vscode.Command = {
       command: '',
       title: ''
    };
    
    constructor(command: string, title: string, args?: any[]) {
        super(title, vscode.TreeItemCollapsibleState.None);
        this.command.command = command;
        this.command.title = title;
        this.command.arguments = args;
    }
}