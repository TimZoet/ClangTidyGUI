import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

import { Checks, loadChecksFile, checksToString, saveChecks } from './checks';
import * as cfg from './config';
import { createOutputFolder, clearOutputFolder, getOutputFilename } from './output';
import { addOutputFolderToTree, runFile, runFolder } from './run';
import { ChecksTreeItem, ChecksCategoryTreeItem, ChecksIssueTreeItem } from './tree/checksTreeItems';
import { ChecksTreeView } from './tree/checksTreeView';
import { DiagnosticsTreeView, SortingType } from './tree/diagnosticsTreeView';
import { FileTreeItem, DiagnosticTreeItem, CategoryTreeItem, IssueTypeTreeItem } from './tree/diagnosticsTreeItems';

export async function activate(context: vscode.ExtensionContext)
{
    let channel = vscode.window.createOutputChannel('Clang Tidy');

    await createOutputFolder();

    // Load or create file with enabled and disabled checks.
    let checks = await loadChecksFile();
    let checksString = checksToString(checks);

    // Create and register ChecksTreeView.
    const checksTreeView = new ChecksTreeView();
    checksTreeView.setChecks(checks);
    vscode.window.registerTreeDataProvider('clangtidychecks', checksTreeView);

    // Create and register DiagnosticsTreeView.
    const diagnosticsTreeView = new DiagnosticsTreeView();
    addOutputFolderToTree(diagnosticsTreeView);
    vscode.window.registerTreeDataProvider('clangtidydiagnostics', diagnosticsTreeView);

    /**
     * File explorer item context commands.
     */

	context.subscriptions.push(vscode.commands.registerCommand('clangtidy.clangTidyFile', async (fileUri: vscode.Uri) => {
        vscode.window.showInformationMessage(`Running clang-tidy on ${path.basename(fileUri.fsPath)}`);
        await runFile(diagnosticsTreeView, fileUri.fsPath, checksString, channel);
        vscode.window.showInformationMessage(`Done running clang-tidy on ${path.basename(fileUri.fsPath)}`);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('clangtidy.clangTidyFolder', async (fileUri: vscode.Uri) => {
        await runFolder(diagnosticsTreeView, fileUri.fsPath, false, checksString, channel);
    }));

    context.subscriptions.push(vscode.commands.registerCommand('clangtidy.clangTidyFolderRecursive', async (fileUri: vscode.Uri) => {
        await runFolder(diagnosticsTreeView, fileUri.fsPath, true, checksString, channel);
    }));

    /**
     * DiagnosticsTreeView title navigation commands.
     */

    context.subscriptions.push(vscode.commands.registerCommand('clangtidy.clear', async () => {
        await clearOutputFolder();
        diagnosticsTreeView.clear();
    }));

    context.subscriptions.push(vscode.commands.registerCommand('clangtidy.refresh', async () => {
        diagnosticsTreeView.clear();
        addOutputFolderToTree(diagnosticsTreeView);
    }));

    context.subscriptions.push(vscode.commands.registerCommand('clangtidy.runAll', async () => {
        await clearOutputFolder();
        diagnosticsTreeView.clear();
        (await cfg.getSourceSubFolders()).forEach(
            async folder => await runFolder(diagnosticsTreeView, folder, true, checksString, channel)
        );
    }));

    /**
     * DiagnosticsTreeView title commands.
     */

    context.subscriptions.push(vscode.commands.registerCommand('clangtidy.sortByCategory', () => {
        diagnosticsTreeView.setSortingType(SortingType.Category);
    }));

    context.subscriptions.push(vscode.commands.registerCommand('clangtidy.sortByCategoryFile', () => {
        diagnosticsTreeView.setSortingType(SortingType.CategoryFile);
    }));

    context.subscriptions.push(vscode.commands.registerCommand('clangtidy.sortByCategoryFileIssue', () => {
        diagnosticsTreeView.setSortingType(SortingType.CategoryFileIssue);
    }));

    context.subscriptions.push(vscode.commands.registerCommand('clangtidy.sortByFile', () => {
        diagnosticsTreeView.setSortingType(SortingType.File);
    }));

    context.subscriptions.push(vscode.commands.registerCommand('clangtidy.sortByFileCategory', () => {
        diagnosticsTreeView.setSortingType(SortingType.FileCategory);
    }));

    context.subscriptions.push(vscode.commands.registerCommand('clangtidy.sortByFileCategoryIssue', () => {
        diagnosticsTreeView.setSortingType(SortingType.FileCategoryIssue);
    }));

    context.subscriptions.push(vscode.commands.registerCommand('clangtidy.sortByFileIssue', () => {
        diagnosticsTreeView.setSortingType(SortingType.FileIssue);
    }));

    context.subscriptions.push(vscode.commands.registerCommand('clangtidy.sortByIssue', () => {
        diagnosticsTreeView.setSortingType(SortingType.Issue);
    }));

    context.subscriptions.push(vscode.commands.registerCommand('clangtidy.sortByIssueFile', () => {
        diagnosticsTreeView.setSortingType(SortingType.IssueFile);
    }));

    /**
     * ChecksTreeView item context commands.
     */

    context.subscriptions.push(vscode.commands.registerCommand('clangtidy.toggleAll', async (item: ChecksTreeItem) => {
        checks['enabled'] = !checks['enabled'];
        checksTreeView.setChecks(checks);
        await saveChecks(checks);
        checksString = checksToString(checks);
    }));

    context.subscriptions.push(vscode.commands.registerCommand('clangtidy.toggleCategory', async (item: ChecksCategoryTreeItem) => {
        const enabled = checks['categories'][item.category]['enabled'];
        checks['categories'][item.category]['enabled'] = !enabled;
        checksTreeView.setChecks(checks);
        await saveChecks(checks);
        checksString = checksToString(checks);
    }));

    context.subscriptions.push(vscode.commands.registerCommand('clangtidy.toggleIssue', async (item: ChecksIssueTreeItem) => {
        const cat = item.issue.split('-')[0];
        const enabled = checks['categories'][cat]['issues'][item.issue];
        checks['categories'][cat]['issues'][item.issue] = !enabled;
        checksTreeView.setChecks(checks);
        await saveChecks(checks);
        checksString = checksToString(checks);
    }));

    context.subscriptions.push(vscode.commands.registerCommand('clangtidy.disableCategories', async (item: ChecksTreeItem) => {
        Object.keys(checks['categories']).forEach(c =>
            checks['categories'][c]['enabled'] = false
        );
        checksTreeView.setChecks(checks);
        await saveChecks(checks);
        checksString = checksToString(checks);
    }));

    context.subscriptions.push(vscode.commands.registerCommand('clangtidy.enableCategories', async (item: ChecksTreeItem) => {
        Object.keys(checks['categories']).forEach(c =>
            checks['categories'][c]['enabled'] = true
        );
        checksTreeView.setChecks(checks);
        await saveChecks(checks);
        checksString = checksToString(checks);
    }));

    context.subscriptions.push(vscode.commands.registerCommand('clangtidy.disableIssues', async (item: ChecksCategoryTreeItem) => {
        Object.keys(checks['categories'][item.category]['issues']).forEach(i =>
            checks['categories'][item.category]['issues'][i] = false
        );
        checksTreeView.setChecks(checks);
        await saveChecks(checks);
        checksString = checksToString(checks);
    }));

    context.subscriptions.push(vscode.commands.registerCommand('clangtidy.enableIssues', async (item: ChecksCategoryTreeItem) => {
        Object.keys(checks['categories'][item.category]['issues']).forEach(i =>
            checks['categories'][item.category]['issues'][i] = true
        );
        checksTreeView.setChecks(checks);
        await saveChecks(checks);
        checksString = checksToString(checks);
    }));

    /**
     * DiagnosticsTreeView item context commands.
     */

    context.subscriptions.push(vscode.commands.registerCommand('clangtidy.deleteFile', async (item: FileTreeItem) => {
        const outputFolder = await cfg.getOutputFolder();
        fs.unlinkSync(path.join(outputFolder, getOutputFilename(item.sourceFile)));
        diagnosticsTreeView.clear();
        addOutputFolderToTree(diagnosticsTreeView);
    }));

    context.subscriptions.push(vscode.commands.registerCommand('clangtidy.rerunFile', async (item: FileTreeItem) => {
        vscode.window.showInformationMessage(`Running clang-tidy on ${path.basename(item.sourceFile)}`);
        await runFile(diagnosticsTreeView, item.sourceFile, checksString, channel);
        vscode.window.showInformationMessage(`Done running clang-tidy on ${path.basename(item.sourceFile)}`);
    }));

    context.subscriptions.push(vscode.commands.registerCommand('clangtidy.viewDiagnostic', async (sourceFile: string, offset: number) => {
        vscode.workspace.openTextDocument(sourceFile).then(doc => {
            const position = doc.positionAt(offset);
            const range = new vscode.Range(position, position);
            vscode.window.showTextDocument(doc).then(editor => {
                editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
                editor.selection = new vscode.Selection(position, position);
            });
        });
    }));

    context.subscriptions.push(vscode.commands.registerCommand('clangtidy.disableDiagnostic', async (item: DiagnosticTreeItem) => {
        const cat = item.diagnostic.category;
        checks['categories'][cat]['issues'][item.diagnostic.issue] = false;
        checksTreeView.setChecks(checks);
        await saveChecks(checks);
        checksString = checksToString(checks);
    }));

    context.subscriptions.push(vscode.commands.registerCommand('clangtidy.disableDiagnosticCategory', async (item: CategoryTreeItem) => {
        const cat = item.category;
        checks['categories'][cat]['enabled'] = false;
        checksTreeView.setChecks(checks);
        await saveChecks(checks);
        checksString = checksToString(checks);
    }));

    context.subscriptions.push(vscode.commands.registerCommand('clangtidy.disableDiagnosticCategoryChildren', async (item: CategoryTreeItem) => {
        const cat = item.category;
        checks['categories'][cat]['enabled'] = false;
        Object.keys(checks['categories'][cat]['issues']).forEach(i =>
            checks['categories'][cat]['issues'][i] = false
        );
        checksTreeView.setChecks(checks);
        await saveChecks(checks);
        checksString = checksToString(checks);
    }));
}

export function deactivate()
{

}
