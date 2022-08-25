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

/**
 * Special operation type that is not added by DOM event.
 */

import WebBrowserWindow from "@/capturer/browser/window/WebBrowserWindow";
import { By, WebElement } from "selenium-webdriver";
import WebDriverClient from "./WebDriverClient";
import HTMLParser from "node-html-parser";

export type InputValueSet = {
  locatorType: "id" | "xpath";
  locator: string;
  locatorMatchType: "equals" | "regex";
  inputValue: string;
};

export default class Autofill {
  private pageSource: string | null = null;
  private xpathList: string[] | null = null;
  private idSet: Set<string> | null = null;

  constructor(
    private readonly client: WebDriverClient,
    private readonly inputValueSets: InputValueSet[],
    private readonly currentWindow: WebBrowserWindow
  ) {}

  public async execute(): Promise<void> {
    for (const inputValueSet of this.inputValueSets) {
      const targetWebElements = await this.getWebElements(
        inputValueSet.locatorType,
        inputValueSet.locator,
        inputValueSet.locatorMatchType
      );

      for (const webElement of targetWebElements) {
        await this.currentWindow.sleep(500);
        await this.currentWindow.focus();

        const tagName = await webElement.getTagName();
        if (tagName === "select") {
          await this.setValueToSelectbox(webElement, inputValueSet.inputValue);
          continue;
        }

        if (tagName === "textarea") {
          await this.setValueToText(webElement, inputValueSet.inputValue);
          continue;
        }

        const inputType = await webElement.getAttribute("type");

        switch (inputType) {
          case "checkbox":
            await this.setValueToCheckbox(webElement, inputValueSet.inputValue);
            break;
          case "radio":
            await this.setValueToRadiobutton(
              webElement,
              inputValueSet.inputValue
            );
            break;
          case "date":
            await this.setValueToDate(webElement, inputValueSet.inputValue);
            break;
          default:
            await this.setValueToText(webElement, inputValueSet.inputValue);
            break;
        }
      }
    }
  }

  public extractIdSetFromPageSource(pageSource: string): Set<string> {
    const regex = RegExp(/id\s*=\s*(?:"[^"]+"|'[^']+'|[^"'=<>\s]+)/g);
    let match: RegExpExecArray | null = null;
    const idSet = new Set<string>();
    while ((match = regex.exec(pageSource)) !== null) {
      const id = match[0].split("=")[1].replace(/"/g, "").replace(/'/g, "");
      idSet.add(id);
    }
    return idSet;
  }

  public async setValueToText(
    target: WebElement,
    value: string
  ): Promise<void> {
    await target.sendKeys(value);
  }

  public async setValueToCheckbox(
    target: WebElement,
    value: string
  ): Promise<void> {
    const v = await target.isSelected();
    if ((v && value === "off") || (!v && value === "on")) {
      await target.click();
    }
  }

  public async setValueToRadiobutton(
    target: WebElement,
    value: string
  ): Promise<void> {
    const v = await target.isSelected();
    if (!v && value === "on") {
      await target.click();
    }
  }

  public async setValueToSelectbox(
    target: WebElement,
    value: string
  ): Promise<void> {
    const options = await target.findElements(By.tagName("option"));
    let targetOption = null;
    for (const option of options) {
      const v = await option.getAttribute("value");
      if (v !== undefined) {
        if (v === value) {
          targetOption = option;
          break;
        } else {
          continue;
        }
      }

      const text = await option.getText();
      if (text === value) {
        targetOption = option;
        break;
      }
    }
    if (targetOption === null) {
      throw new Error("Option not found.");
    }
    await target.click();
    await targetOption.click();
  }

  public async setValueToDate(
    target: WebElement,
    value: string
  ): Promise<void> {
    const yyyymmdd = value.split("-");
    return await this.setValueToText(
      target,
      `${("00" + yyyymmdd[0]).slice(-6)}-${yyyymmdd[1]}-${yyyymmdd[2]}`
    );
  }

  private async getWebElements(
    locatorType: "id" | "xpath",
    locator: string,
    locatorMatchType: "equals" | "regex"
  ): Promise<WebElement[]> {
    if (locatorMatchType === "equals") {
      const element =
        locatorType === "id"
          ? await this.client.getElementById(locator)
          : await this.client.getElementByXpath(locator);
      return [element];
    }

    if (locatorType === "id") {
      return this.getWebElementsByRegexId(locator);
    }

    return this.getWebElementsByRegexXpath(locator);
  }

  private async getWebElementsByRegexId(
    locator: string
  ): Promise<WebElement[]> {
    const regex = new RegExp(locator);
    if (!this.idSet) {
      if (this.pageSource === null) {
        this.pageSource = await this.client.getCurrentPageSource();
      }
      this.idSet = this.extractIdSetFromPageSource(this.pageSource);
    }
    const matchIds: string[] = [];
    this.idSet.forEach((id) => {
      if (regex.test(id)) {
        matchIds.push(id);
      }
    });
    return Promise.all(
      matchIds.map(async (id) => {
        return await this.client.getElementById(id);
      })
    );
  }

  private async getWebElementsByRegexXpath(
    locator: string
  ): Promise<WebElement[]> {
    const regex = new RegExp(locator);
    if (!this.xpathList) {
      if (this.pageSource === null) {
        this.pageSource = await this.client.getCurrentPageSource();
      }
      this.xpathList = this.getAllXpath(this.pageSource);
    }
    const matchXpath = this.xpathList.filter((xpath) => {
      return regex.test(xpath);
    });

    return Promise.all(
      matchXpath.map(async (xpath) => {
        return await this.client.getElementByXpath(xpath);
      })
    );
  }

  private getAllXpath(pageSource: string): string[] {
    const result: string[] = [];

    const getTagName = (element: Node): string => {
      return (element as any).rawTagName.toLowerCase();
    };

    const elementSearch = (element: Node, path: string[], index: number) => {
      path.push(
        `${getTagName(element)}${index === 0 ? "" : "[" + index + "]"}`
      );

      const children: Node[] = [];
      const tagHasMultipleMap: Map<string, boolean> = new Map();
      element.childNodes.forEach((v) => {
        if (v.nodeType === 1) {
          const name = getTagName(v);
          tagHasMultipleMap.has(name)
            ? tagHasMultipleMap.set(name, true)
            : tagHasMultipleMap.set(name, false);

          children.push(v);
        }
      });

      if (children.length === 0) {
        result.push(`/${path.join("/")}`);
        return;
      }

      const tags: string[] = [];
      children.forEach((child) => {
        const tagName = getTagName(child);
        tags.push(tagName);
        elementSearch(
          child,
          [...path],
          tagHasMultipleMap.get(tagName)
            ? tags.reduce((pre, cur) => {
                return cur === tagName ? pre + 1 : pre;
              }, 0)
            : 0
        );
      });
    };
    const root = HTMLParser.parse(pageSource, { voidTag: { tags: [] } });
    const htmlTag = root.childNodes.filter((node) => node.nodeType === 1);
    elementSearch(htmlTag[0] as unknown as Node, [], 0);

    return result;
  }
}
