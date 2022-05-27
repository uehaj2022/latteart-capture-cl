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

import WebDriverClient from "./WebDriverClient";
import { PlatformName, Browser } from "../CaptureConfig";
import { Builder, Capabilities, ThenableWebDriver } from "selenium-webdriver";
import { APPIUM_SERVER_URL } from "./AppiumHealthChecker";
import { SeleniumWebDriverClient } from "./SeleniumWebDriverClient";
import { Options } from "selenium-webdriver/chrome";

/**
 * The class for creating {@link WebDriverClient}.
 */
export default class WebDriverClientFactory {
  /**
   * Create {@link WebDriverClient}.
   * @param params.platformName Platform name.
   * @param params.browserName Browser name.
   * @param params.device.id Device ID.
   * @param params.device.name Device name.
   * @param params.device.osVersion OS version of the device.
   * @param params.browserBinaryPath Browser binary path.
   * @returns Created instance.
   */
  public async create(params: {
    platformName: PlatformName;
    browserName: Browser;
    device: {
      id: string;
      name: string;
      osVersion: string;
    };
    browserBinaryPath: string;
  }): Promise<WebDriverClient> {
    const driver = await (async () => {
      if (params.platformName === PlatformName.Android) {
        return await this.createWebDriverBuilderForAndroid(params.device.id);
      }
      if (params.platformName === PlatformName.iOS) {
        return await this.createWebDriverBuilderForIOS(
          params.device.id,
          params.device.name
        );
      }
      return await this.createWebDriverBuilderForPC(
        params.browserBinaryPath,
        params.browserName
      );
    })();

    return new SeleniumWebDriverClient(driver);
  }

  private createWebDriverBuilderForPC(
    browserPath: string,
    browserName: Browser
  ) {
    const serverUrl = "http://127.0.0.1:9515";

    if (browserName === Browser.Edge) {
      return this.createEdgeWebDriverBuilder(serverUrl);
    } else {
      return this.createChromeWebDriverBuilder(browserPath, serverUrl);
    }
  }

  private createChromeWebDriverBuilder(
    browserPath: string,
    serverUrl: string
  ): ThenableWebDriver {
    const caps = new Capabilities();
    caps.setPageLoadStrategy("eager");
    if (browserPath !== "") {
      const options = new Options().setChromeBinaryPath(browserPath);
      return new Builder()
        .withCapabilities(caps)
        .forBrowser("chrome")
        .setChromeOptions(options)
        .usingServer(serverUrl)
        .build();
    }
    return new Builder()
      .withCapabilities(caps)
      .forBrowser("chrome")
      .usingServer(serverUrl)
      .build();
  }

  private createEdgeWebDriverBuilder(serverUrl: string): ThenableWebDriver {
    const caps = new Capabilities();
    caps.setPageLoadStrategy("eager");
    return new Builder()
      .withCapabilities(caps)
      .forBrowser("MicrosoftEdge")
      .usingServer(serverUrl)
      .build();
  }

  private createWebDriverBuilderForIOS(deviceId: string, deviceName: string) {
    return new Builder()
      .usingServer(APPIUM_SERVER_URL)
      .withCapabilities({
        browserName: Browser.Safari,
        udid: deviceId,
        deviceName,
        platformName: PlatformName.iOS,
        automationName: "XCUITest",
        nativeWebScreenshot: true,
      })
      .build();
  }

  private createWebDriverBuilderForAndroid(deviceId: string) {
    return new Builder()
      .usingServer(APPIUM_SERVER_URL)
      .withCapabilities({
        browserName: Browser.Chrome,
        deviceName: deviceId,
        platformName: PlatformName.Android,
        nativeWebScreenshot: true,
      })
      .build();
  }
}
