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

import WebDriverClient from "./WebDriverClient";
import { Alert, By, WebDriver } from "selenium-webdriver";

/**
 * Selenium WebDriver client.
 */
export class SeleniumWebDriverClient implements WebDriverClient {
  private driver: WebDriver;

  /**
   * Constructor.
   * @param driver WebDriver instance.
   */
  constructor(driver: WebDriver) {
    this.driver = driver;
  }

  /**
   * @inheritdoc
   */
  public async open(url: string): Promise<void> {
    return this.driver.get(url);
  }

  /**
   * @inheritdoc
   */
  public async setTimeouts(
    timeouts: Partial<{
      implicit: number;
      pageLoad: number;
      script: number;
    }> = {}
  ): Promise<void> {
    if (timeouts.implicit !== undefined) {
      await this.driver.manage().setTimeouts({ implicit: timeouts.implicit });
    }

    if (timeouts.pageLoad !== undefined) {
      await this.driver.manage().setTimeouts({ implicit: timeouts.pageLoad });
    }

    if (timeouts.script !== undefined) {
      await this.driver.manage().setTimeouts({ implicit: timeouts.script });
    }
  }

  /**
   * @inheritdoc
   */
  public async sleep(ms: number): Promise<void> {
    return this.driver.sleep(ms);
  }

  /**
   * @inheritdoc
   */
  public async refresh(): Promise<void> {
    return this.driver.navigate().refresh();
  }

  /**
   * @inheritdoc
   */
  public async close(): Promise<void> {
    return this.driver.quit();
  }

  /**
   * @inheritdoc
   */
  public async getAllWindowHandles(): Promise<string[]> {
    try {
      return await this.driver.getAllWindowHandles();
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "NoSuchWindowError") {
          return [];
        }
      }
      throw error;
    }
  }

  /**
   * @inheritdoc
   */
  public async switchWindowTo(windowHandle: string): Promise<void> {
    try {
      return await this.driver.switchTo().window(windowHandle);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "NoSuchWindowError") {
          return;
        }
      }
      throw error;
    }
  }

  /**
   * @inheritdoc
   */
  public async alertIsVisible(): Promise<boolean> {
    return (await this.getAlert()) !== undefined;
  }

  /**
   * @inheritdoc
   */
  public async getCurrentUrl(): Promise<string> {
    try {
      return await this.driver.getCurrentUrl();
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "NoSuchWindowError") {
          return "";
        }
      }
      throw error;
    }
  }

  /**
   * @inheritdoc
   */
  public async getCurrentWindowHandle(): Promise<string> {
    try {
      return await this.driver.getWindowHandle();
    } catch (error) {
      if (error instanceof Error) {
        console.error(error);
        if (error.name === "NoSuchWindowError") {
          return "";
        }
      }
      throw error;
    }
  }

  /**
   * @inheritdoc
   */
  public async getCurrentTitle(): Promise<string> {
    try {
      return await this.driver.getTitle();
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "NoSuchWindowError") {
          return "";
        }
      }
      throw error;
    }
  }

  /**
   * @inheritdoc
   */
  public async takeScreenshot(): Promise<string> {
    try {
      return this.driver.takeScreenshot();
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "NoSuchWindowError") {
          return "";
        }
      }
      throw error;
    }
  }

  /**
   * @inheritdoc
   */
  public async browserBack(): Promise<void> {
    return this.driver.navigate().back();
  }

  /**
   * @inheritdoc
   */
  public async browserForward(): Promise<void> {
    return this.driver.navigate().forward();
  }

  /**
   * @inheritdoc
   */
  public async getCurrentPageSource(): Promise<string> {
    try {
      return await this.driver.getPageSource();
    } catch (error) {
      if (error instanceof Error) {
        if (error.name == "NoSuchWindowError") {
          return "";
        }
      }
      throw error;
    }
  }

  /**
   * @inheritdoc
   */
  public async getCurrentPageText(): Promise<string> {
    try {
      return await this.driver.findElement(By.css("body")).getText();
    } catch (error) {
      if (error instanceof Error) {
        if (error.name == "NoSuchWindowError") {
          return "";
        }
      }
      throw error;
    }
  }

  /**
   * @inheritdoc
   */
  public async execute<T, U>(
    script: (args: U) => T,
    args?: U
  ): Promise<T | null> {
    try {
      let notReady = true;
      for (let cnt = 0; cnt < 30; cnt++) {
        notReady =
          (await this.driver.executeScript(
            `return !document || !document.body`
          )) ?? true;
        if (!notReady) {
          break;
        }
        await this.driver.sleep(100);
      }
      if (notReady) {
        throw new Error("timeout error");
      }

      return await this.driver.executeScript(
        `return (${script})(...arguments);`,
        args
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.name == "NoSuchWindowError") {
          return null;
        }
      }
      throw error;
    }
  }

  /**
   * @inheritdoc
   */
  public async executeAsync<T, U>(
    script: (done: (returnValue: T) => void, args: U) => void,
    args?: U
  ): Promise<T | null> {
    return this.driver.executeAsyncScript(
      `
        if (arguments.length === 0) {
          return (${script})(arguments[0]);
        } else {
          return (${script})(arguments[arguments.length - 1], arguments[0]);
        }
      `,
      args
    );
  }

  /**
   * @inheritdoc
   */
  public async clickElement(xpath: string): Promise<void> {
    const elementForClick = this.driver.findElement(By.xpath(xpath));

    return elementForClick.click();
  }

  /**
   * @inheritdoc
   */
  public async clearAndSendKeysToElement(
    xpath: string,
    value: string
  ): Promise<void> {
    const elementForInput = this.driver.findElement(By.xpath(xpath));

    await elementForInput.clear();

    return elementForInput.sendKeys(value);
  }

  /**
   * @inheritdoc
   */
  public async sendKeys(xpath: string, value: string): Promise<void> {
    const elementForInput = this.driver.findElement(By.xpath(xpath));
    return elementForInput.sendKeys(value);
  }

  /**
   * @inheritdoc
   */
  public async acceptAlert(text = ""): Promise<void> {
    const alert = await this.getAlert();

    if (text) {
      await alert?.sendKeys(text);
    }

    return alert?.accept();
  }

  /**
   * @inheritdoc
   */
  public async dismissAlert(): Promise<void> {
    const alert = await this.getAlert();

    return alert?.dismiss();
  }

  /**
   * @inheritdoc
   */
  public async getDocumentReadyState(): Promise<string> {
    const readyState = (await this.driver.executeScript(
      "return document.readyState"
    )) as string;
    return readyState;
  }

  private async getAlert(): Promise<Alert | undefined> {
    try {
      return await this.driver.switchTo().alert();
    } catch (error) {
      return undefined;
    }
  }
}
