# LatteArt Capture CL

LatteArt Capture CL is a service that capture users' operations on a web browser for LatteArt.

- 日本語版は[README_ja.md](/README_ja.md)を参照して下さい。

This service capture users' operations using WebDriver.

## Project Setup

1. Install `node.js v14.15.3`.
2. Install `yarn` corresponding to the version of node.js.
3. Go to the root directory of the project.
4. Execute the following command.

   ```bash
   yarn install
   ```

## Build

1. Go to the root directory of the project.
1. Execute the following command.
   ```bash
   yarn package
   ```
1. The following directory and file is created in `dist/latteart-capture-cl`.
   ```bash
   latteart-capture-cl
       ├─ latteart-capture-cl.exe # for Windows
       └─ latteart-capture-cl # for Mac
   ```

## Watch (for developer)

Detect source code changes and rebuild LatteArt Capture CL.

1. Go to the root directory of the project.
1. Execute the following command.
   ```bash
   yarn watch
   ```
1. The directory `dist` is created in the current directory, and `dist` contains built `index.js`. (If you update the source code, it is rebuilt automatically.)

## Run

### Preparation

1. Install the following tools and add them to the PATH.
   - If the platform of system under test is PC
     1. `chromedriver` corresponding to the version of Google Chrome.
     1. `cwebp`
   - If the platform of system under test is Android
     1. `chromedriver` corresponding to the version of Google Chrome.
     1. `cwebp`
     1. `adb`
     1. `Appium`
1. Start the Appium server if the platform of system under test is other than PC.

### How to use

1. Execute the `latteart-capture-cl.exe` or `latteart-capture-cl`.
1. The local server will stand up and wait at `http://127.0.0.1:3001`.

## License

This software is licensed under the Apache License, Version2.0.
