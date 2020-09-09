# Clang Tidy GUI

Clang Tidy GUI integrates clang-tidy into Visual Studio Code and displays all diagnostics in a convenient interface.

![Screenshot](./resources/screen_diagnostics.png)

## Features

* Run clang-tidy from the file explorer on files or entire folders.
* View the results in a nice interface that has many convenient actions available from the context menus.
* Enable and disable specific checks.
* Results are stored on disk and therefore persist when closing VS Code.
* Configure the number of files that is analysed in parallel.

## Extension Settings

This extension contributes the following settings:

* `clangtidy.buildPath`: Path to the build folder containing the compile_commands.json file.
* `clangtidy.executablePath`: Path to the clang-tidy executable.
* `clangtidy.fileFilter`: Regular expression that is used to filter source files when analyzing folders.
* `clangtidy.outputPath`: Path to the folder to which output files are written.
* `clangtidy.parallelTasks`: Number of clang-tidy tasks to run in parallel. Set to 0 to run as many tasks as there are logical cores.
* `clangtidy.sourcePath`: Path to the folder that contains all source files.

## Requirements

* This extension uses the [js-yaml](https://www.npmjs.com/package/js-yaml) package.
* You will need to install some version of [clang-tidy](https://clang.llvm.org/extra/clang-tidy).
* Your build system will need to output a `compile_commands.json` file for clang-tidy.

## Release Notes

### 1.0.0

Initial release.