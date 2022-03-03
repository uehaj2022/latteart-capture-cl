/**
 * Copyright 2022 NTT Corporation.
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
import WebDriverClient from "@/webdriver/WebDriverClient";
import LoggingService from "../logger/LoggingService";
import { SpecialOperationType } from "../SpecialOperationType";
import { TimestampImpl } from "../Timestamp";

/**
 * The class for Running operations.
 */
export default class BrowserOperationRunner {
  /**
   * Convert operations to Map.
   * @param operations Operations.
   * @returns The Map(key = index, value = window handle).
   */
  public static createRecordedWindowHandleMap(
    operations: Operation[]
  ): Map<number, string> {
    const recordedWindowHandleMap = new Map<number, string>();
    let recordedHandleCount = 0;

    operations.forEach((operation: Operation) => {
      const newHandle = operation.windowHandle;
      let isExists = false;
      recordedWindowHandleMap.forEach((handleId: string) => {
        if (handleId === newHandle) {
          isExists = true;
        }
      });
      if (!isExists) {
        recordedWindowHandleMap.set(recordedHandleCount, newHandle);
        recordedHandleCount++;
      }
    });
    return recordedWindowHandleMap;
  }

  /**
   * Set the unset window handles in the Map.
   * @param windowHandles Window handles.
   * @param replayWindowHandleMap The Map of replay target window handles.
   * @param handleCountObj The counter for assigning keys to the Map.
   */
  public static updateReplayWindowHandleMap(
    windowHandles: string[],
    replayWindowHandleMap: Map<number, string>,
    handleCountObj: { counter: number }
  ): void {
    windowHandles.forEach((windowHandle: string) => {
      let isExists = false;
      replayWindowHandleMap.forEach((handleId: string) => {
        if (handleId === windowHandle) {
          isExists = true;
        }
      });
      if (!isExists) {
        replayWindowHandleMap.set(handleCountObj.counter, windowHandle);
        handleCountObj.counter++;
      }
    });
  }

  /**
   * Find a window handle from the window handle Map and return found key.
   * If not found, return -1.
   * @param windowHandle Window handle.
   * @param windowHandleMap The window handle Map.
   * @returns The key of the window handle that is found. If not found, return -1.
   */
  public static getHandleKey(
    windowHandle: string,
    windowHandleMap: Map<number, string>
  ): number {
    let resultKey = -1;
    windowHandleMap.forEach((handleId: string, key: number) => {
      if (windowHandle === handleId) {
        resultKey = key;
      }
    });
    return resultKey;
  }

  private client: WebDriverClient;

  private onBrowserClosed: () => void;

  /**
   * Constructor.
   * @param client The client for running operations.
   * @param callbacks.onBrowserClosed The callback when browser is closed.
   */
  constructor(
    client: WebDriverClient,
    callbacks: {
      onBrowserClosed: () => void;
    }
  ) {
    this.client = client;
    this.onBrowserClosed = callbacks.onBrowserClosed;
  }

  /**
   * Run operations.
   * @param operations Operations.
   */
  public async run(operations: Operation[]): Promise<void> {
    if (operations.length === 0) {
      return;
    }

    try {
      await this.client.open(operations[0].url);

      const recordedWindowHandleMap = BrowserOperationRunner.createRecordedWindowHandleMap(
        operations
      );
      const replayWindowHandleMap = new Map<number, string>();
      const replayHandleCount = { counter: 0 };
      let lastRecordedWindowHandle = "";

      await this.client.sleep(1000);

      for (const [index, operation] of operations.entries()) {
        if (index > 0) {
          const previous = new TimestampImpl(operations[index - 1].timestamp);
          const current = new TimestampImpl(operations[index].timestamp);

          await this.client.sleep(current.diff(previous));
        }

        const windowHandles = await this.client.getAllWindowHandles();
        BrowserOperationRunner.updateReplayWindowHandleMap(
          windowHandles,
          replayWindowHandleMap,
          replayHandleCount
        );

        if (operation.windowHandle !== lastRecordedWindowHandle) {
          const handleKey = BrowserOperationRunner.getHandleKey(
            operation.windowHandle,
            recordedWindowHandleMap
          );
          if (handleKey !== -1) {
            const switchHandleId = replayWindowHandleMap.get(
              handleKey
            ) as string;
            await this.client.switchWindowTo(switchHandleId);
          }
          lastRecordedWindowHandle = operation.windowHandle;
        }

        switch (operation.type as SpecialOperationType) {
          case SpecialOperationType.ACCEPT_ALERT:
            await this.client.acceptAlert(operation.input);
            continue;

          case SpecialOperationType.DISMISS_ALERT:
            await this.client.dismissAlert();
            continue;

          case SpecialOperationType.BROWSER_BACK:
            await this.client.browserBack();
            continue;

          case SpecialOperationType.BROWSER_FORWARD:
            await this.client.browserForward();
            continue;

          case SpecialOperationType.SWITCH_WINDOW:
            continue;

          default:
            break;
        }

        if (operation.elementInfo === null) {
          continue;
        }

        const xpath = operation.elementInfo.xpath.toLowerCase();

        switch (operation.type) {
          case "click":
            await this.client.clickElement(xpath);

            continue;

          case "change":
            if (operation.elementInfo.tagname.toLowerCase() === "select") {
              await this.client.clickElement(
                `${xpath}/option[@value="${operation.input}"]`
              );
            }

            if (operation.elementInfo.tagname.toLowerCase() === "input") {
              await this.client.clearAndSendKeysToElement(
                xpath,
                operation.input
              );
            }

            continue;

          default:
            continue;
        }
      }
    } catch (error) {
      if (
        error.name === "WebDriverError" ||
        error.name === "NoSuchWindowError"
      ) {
        LoggingService.debug(error);
      } else {
        throw error;
      }
    } finally {
      await this.quit();
    }
  }

  /**
   * Stop running operations.
   */
  public async quit(): Promise<void> {
    await this.client.close();
    this.onBrowserClosed();
  }
}
