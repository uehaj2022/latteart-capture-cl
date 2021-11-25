import { Browser, PlatformName } from "@/CaptureConfig";
import BrowserOperationCapturer from "@/capturer/BrowserOperationCapturer";
import { Operation } from "@/Operation";
import ScreenTransition from "@/ScreenTransition";
import { SeleniumWebDriverClient } from "@/webdriver/SeleniumWebDriverClient";
import { Builder, By, Capabilities, Key } from "selenium-webdriver";

jest.setTimeout(1000 * 60 * 60);

describe("動作確認用", () => {
  let capturer: BrowserOperationCapturer;

  const callbacks = {
    onGetOperation: (operation: Operation) => {
      console.log(
        `get operation.: ${JSON.stringify({
          input: operation.input,
          type: operation.type,
          elementInfo: operation.elementInfo,
          title: operation.title,
          url: operation.url,
          windowHandle: operation.windowHandle,
        })}`
      );
    },
    onGetScreenTransition: (screenTransition: ScreenTransition) => {
      console.log(
        `get screen transition.: ${JSON.stringify({
          title: screenTransition.title,
          url: screenTransition.url,
          windowHandle: screenTransition.windowHandle,
        })}`
      );
    },
    onBrowserClosed: () => {
      console.log("Browser closed.");
    },
    onBrowserHistoryChanged: (browserStatus: {
      canGoBack: boolean;
      canGoForward: boolean;
    }) => {
      console.log(`Browser history changed.: ${JSON.stringify(browserStatus)}`);
    },
    onBrowserWindowsChanged: (
      windowHandles: string[],
      currentWindowHandle: string
    ) => {
      console.log(
        `Browser windows changed.: ${JSON.stringify({
          windowHandles,
          currentWindowHandle,
        })}`
      );

      capturer.switchCapturingWindow(currentWindowHandle);
    },
    onAlertVisibilityChanged: (isVisible: boolean) => {
      console.log(
        `alert visibility changed.: ${JSON.stringify({
          isVisible: isVisible,
        })}`
      );
    },
    onError: (error: Error) => {
      fail(error);
    },
  };

  const config = {
    platformName: PlatformName.PC,
    browserName: Browser.Chrome,
    device: {
      id: "",
      name: "",
      osVersion: "",
    },
    platformVersion: "",
    waitTimeForStartupReload: 0,
  };

  it("BrowserOperationCapturer", async () => {
    const url = "";

    if (url) {
      const caps = new Capabilities();
      caps.setPageLoadStrategy("none");
      const client = new SeleniumWebDriverClient(
        new Builder().withCapabilities(caps).forBrowser("chrome").build()
      );

      capturer = new BrowserOperationCapturer(client, config, callbacks);

      await capturer.start(url);
    } else {
      fail("URLが指定されていません。");
    }
  });
  it("webdriver test", async () => {
    const url = "";

    let driver;
    try {
      const caps = new Capabilities();
      caps.setPageLoadStrategy("normal");
      driver = await new Builder()
        .withCapabilities(caps)
        .forBrowser("chrome")
        .build();

      await driver.get(url);
      // await driver.findElement(By.id("date_form1")).sendKeys(Key.TAB);
      await driver.findElement(By.id("date_form")).sendKeys(Key.SPACE);
      await driver.sleep(3000);
    } catch (e) {
      console.error(e);
    } finally {
      await driver?.close();
    }
  });
});
