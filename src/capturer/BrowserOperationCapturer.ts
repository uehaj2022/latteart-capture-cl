/**
 * Copyright 2021 NTT Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Operation } from "../Operation";
import LoggingService from "../logger/LoggingService";
import WebBrowser from "./browser/WebBrowser";
import { CaptureConfig } from "../CaptureConfig";
import WebDriverClient from "@/webdriver/WebDriverClient";
import ScreenTransition from "../ScreenTransition";
import { SpecialOperationType } from "../SpecialOperationType";

/**
 * The class for monitoring and getting browser operations.
 */
export default class BrowserOperationCapturer {
  private actionQueue: Array<(capturer: WebBrowser) => Promise<void>> = [];

  private client: WebDriverClient;
  private config: CaptureConfig;
  private webBrowser: WebBrowser | null = null;
  private capturingIsPaused = false;

  private alertIsVisible = false;

  private onGetOperation: (operation: Operation) => void;
  private onGetScreenTransition: (operation: ScreenTransition) => void;
  private onBrowserClosed: () => void;
  private onBrowserHistoryChanged: (browserStatus: {
    canGoBack: boolean;
    canGoForward: boolean;
  }) => void;
  private onBrowserWindowsChanged: (
    windowHandles: string[],
    currentWindowHandle: string
  ) => void;
  private onAlertVisibilityChanged: (isVisible: boolean) => void;
  private onError: (error: Error) => void;

  /**
   * Constructor.
   * @param client The WebDriver client to access a browser.
   * @param config Capture config.
   * @param callbacks.onGetOperation The callback when an operation is captured.
   * @param callbacks.onGetScreenTransition The callback when a screen transition is captured.
   * @param callbacks.onBrowserClosed The callback when browser is closed.
   * @param callbacks.onBrowserHistoryChanged The callback when browser history changes.
   * @param callbacks.onBrowserWindowsChanged The callback when opened windows are changed.
   * @param callbacks.onError The callback when an error occurs.
   */
  constructor(
    client: WebDriverClient,
    config: CaptureConfig,
    callbacks: {
      onGetOperation: (operation: Operation) => void;
      onGetScreenTransition: (screenTransition: ScreenTransition) => void;
      onBrowserClosed: () => void;
      onBrowserHistoryChanged: (browserStatus: {
        canGoBack: boolean;
        canGoForward: boolean;
      }) => void;
      onBrowserWindowsChanged: (
        windowHandles: string[],
        currentWindowHandle: string
      ) => void;
      onAlertVisibilityChanged: (isVisible: boolean) => void;
      onError: (error: Error) => void;
    }
  ) {
    this.client = client;
    this.config = config;
    this.onGetOperation = callbacks.onGetOperation;
    this.onGetScreenTransition = callbacks.onGetScreenTransition;
    this.onBrowserClosed = callbacks.onBrowserClosed;
    this.onBrowserHistoryChanged = callbacks.onBrowserHistoryChanged;
    this.onBrowserWindowsChanged = callbacks.onBrowserWindowsChanged;
    this.onAlertVisibilityChanged = callbacks.onAlertVisibilityChanged;
    this.onError = callbacks.onError;
  }

  /**
   * Start monitoring and capturing a page.
   * @param url Target URL.
   */
  public async start(url: string): Promise<void> {
    const browser = new WebBrowser(this.client, this.config, {
      onGetOperation: this.onGetOperation,
      onGetScreenTransition: this.onGetScreenTransition,
      onHistoryChanged: this.onBrowserHistoryChanged,
      onWindowsChanged: this.onBrowserWindowsChanged,
      onAlertVisibilityChanged: this.onAlertVisibilityChanged,
    });

    try {
      await browser.open(url);
    } catch (error) {
      this.onError(error);
      this.onBrowserClosed();

      return;
    }

    this.webBrowser = browser;

    let acceptAlertOperation: Operation | null = null;

    let shouldDeleteCapturedData = false;
    let lastAlertIsVisible = false;

    while (this.isCapturing()) {
      try {
        this.alertIsVisible = await this.client.alertIsVisible();

        if (shouldDeleteCapturedData && !this.alertIsVisible) {
          await this.webBrowser.currentWindow?.deleteCapturedDatas();
          shouldDeleteCapturedData = false;
        }

        if (this.alertIsVisible !== lastAlertIsVisible) {
          lastAlertIsVisible = this.alertIsVisible;
          this.onAlertVisibilityChanged(this.alertIsVisible);
        }
        // Wait.
        await ((msec) => new Promise((resolve) => setTimeout(resolve, msec)))(
          100
        );

        // Delete actions after executing all registered actions.
        await Promise.all(
          this.actionQueue.map(async (action) => {
            await action(this.webBrowser!);
          })
        );
        this.actionQueue = [];

        if (!this.isCapturing()) {
          return;
        }

        if (this.alertIsVisible) {
          if (acceptAlertOperation) {
            shouldDeleteCapturedData = true;
            continue;
          }

          const currentWindow = this.webBrowser.currentWindow;

          if (!currentWindow) {
            continue;
          }

          acceptAlertOperation = currentWindow.createCapturedOperation({
            type: SpecialOperationType.ACCEPT_ALERT,
            windowHandle: currentWindow.windowHandle,
          });

          continue;
        }

        if (acceptAlertOperation) {
          this.onGetOperation(acceptAlertOperation);

          acceptAlertOperation = null;
        }

        // Updates browser state.
        await this.webBrowser.updateState();

        if (this.webBrowser.isWindowSelecting) {
          continue;
        }

        if (this.webBrowser.countWindows() === 0) {
          await this.webBrowser.close();

          return;
        }

        // Capture operations.
        const currentWindow = this.webBrowser.currentWindow;

        if (currentWindow) {
          if (this.capturingIsPaused) {
            await currentWindow.pauseCapturing();
          } else {
            await currentWindow.resumeCapturing();
          }

          await currentWindow.captureScreenTransition();
          await currentWindow.captureOperations();
        }
      } catch (error) {
        if (
          error.name === "UnexpectedAlertOpenError" ||
          error.name === "TimeoutError"
        ) {
          LoggingService.debug(error);
          continue;
        }

        await this.webBrowser!.close();

        if (
          error.name === "WebDriverError" ||
          error.name === "NoSuchWindowError"
        ) {
          LoggingService.debug(error);

          continue;
        }

        throw error;
      }
    }

    this.onBrowserClosed();
  }

  /**
   * Stop capturing operations.
   */
  public quit(): void {
    this.actionQueue.push(async (browser) => {
      this.onBrowserClosed();

      await browser.close();
      this.webBrowser = null;
    });
  }

  /**
   * Take a screenshot of the monitored screen.
   * If failed to take a screenshot, call a callback function and return empty string.
   * @param onError The callback when failed to take a screenshot.
   * @returns Screenshot.(base64)
   */
  public async getScreenshot(onError?: (e: Error) => void): Promise<string> {
    if (!this.isCapturing()) {
      return "";
    }
    const currentWindow = this.webBrowser!.currentWindow;
    if (!currentWindow) {
      return "";
    }
    await currentWindow.focus();
    await currentWindow.sleep(500);
    return currentWindow.getScreenshot().catch((e) => {
      if (onError !== undefined) {
        onError(e);
      }
      return "";
    });
  }

  /**
   * Whether it is capturing or not.
   * @returns 'true': It is capturing, 'false': It is not capturing.
   */
  public isCapturing(): boolean {
    return this.webBrowser?.isOpened ?? false;
  }

  public isWindowSelecting(): boolean {
    return this.webBrowser?.isWindowSelecting ?? false;
  }

  /**
   * Switch capturing window.
   * @param destWindowHandle Destination window handle.
   */
  public async switchCapturingWindow(destWindowHandle: string): Promise<void> {
    if (!this.isCapturing) {
      return;
    }

    await this.webBrowser?.unprotectAllWindow();
    await this.webBrowser?.switchWindowTo(destWindowHandle);
  }

  public async switchCancel(): Promise<void> {
    if (!this.isCapturing || !this.webBrowser) {
      return;
    }
    await this.webBrowser.unprotectAllWindow();
  }

  public async selectCapturingWindow(): Promise<void> {
    if (!this.isCapturing || !this.webBrowser) {
      return;
    }
    await this.webBrowser.protectAllWindow();
  }

  /**
   * Go back to previous page on capturing browser.
   */
  public browserBack(): void {
    this.actionQueue.push(async (browser) => {
      if (!this.canDoBrowserBack()) {
        return;
      }
      const currentWindow = browser.currentWindow;
      if (!currentWindow) {
        return;
      }

      const operation = await currentWindow.browserBack();
      this.onGetOperation(operation);
    });
  }

  /**
   * Go forward to next page on capturing browser.
   */
  public browserForward(): void {
    this.actionQueue.push(async (browser) => {
      if (!this.canDoBrowserForward()) {
        return;
      }
      const currentWindow = browser.currentWindow;
      if (!currentWindow) {
        return;
      }

      const operation = await currentWindow.browserForward();
      this.onGetOperation(operation);
    });
  }

  /**
   * Pause capturing.
   */
  public pauseCapturing(): void {
    const currentWindow = this.webBrowser?.currentWindow;

    if (!this.capturingIsPaused && currentWindow) {
      this.capturingIsPaused = true;

      this.onGetOperation(
        currentWindow.createCapturedOperation({
          type: SpecialOperationType.PAUSE_CAPTURING,
          windowHandle: currentWindow.windowHandle,
        })
      );
    }
  }

  /**
   * Resume capturing.
   */
  public resumeCapturing(): void {
    const currentWindow = this.webBrowser?.currentWindow;

    if (this.capturingIsPaused && currentWindow) {
      this.capturingIsPaused = false;

      this.onGetOperation(
        currentWindow.createCapturedOperation({
          type: SpecialOperationType.RESUME_CAPTURING,
          windowHandle: currentWindow.windowHandle,
        })
      );
    }
  }

  private canDoBrowserBack() {
    if (!this.isCapturing()) {
      return false;
    }
    const currentWindow = this.webBrowser!.currentWindow;
    if (!currentWindow) {
      return false;
    }
    return currentWindow.canDoBrowserBack();
  }

  private canDoBrowserForward() {
    if (!this.isCapturing()) {
      return false;
    }
    const currentWindow = this.webBrowser!.currentWindow;
    if (!currentWindow) {
      return false;
    }
    return currentWindow.canDoBrowserForward();
  }
}
