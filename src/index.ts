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

import express from "express";
import http from "http";
import socketIO from "socket.io";
import BrowserOperationCapturer from "./capturer/BrowserOperationCapturer";
import { CaptureConfig } from "./CaptureConfig";
import LoggingService from "./logger/LoggingService";
import StandardLogger, { RunningMode } from "./logger/StandardLogger";
import { AndroidDeviceAccessor } from "./device/AndroidDeviceAccessor";
import { IOSDeviceAccessor } from "./device/IOSDeviceAccessor";
import WebDriverClientFactory from "./webdriver/WebDriverClientFactory";
import { Operation } from "./Operation";
import { ServerError, ServerErrorCode } from "./ServerError";
import path from "path";
import { TimestampImpl } from "./Timestamp";
import WebDriverClient from "./webdriver/WebDriverClient";
import { setupWebDriverServer } from "./webdriver/setupWebDriver";

const appRootPath = path.relative(process.cwd(), path.dirname(__dirname));

const app = express();
app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );

  next();
});

const server = http.createServer(app);
const socket = socketIO(server);

/**
 * The Socket.IO event that is sent to server from client.
 */
enum ClientToServerSocketIOEvent {
  START_CAPTURE = "start_capture",
  STOP_CAPTURE = "stop_capture",
  TAKE_SCREENSHOT = "take_screenshot",
  BROWSER_BACK = "browser_back",
  BROWSER_FORWARD = "browser_forward",
  SWITCH_CAPTURING_WINDOW = "switch_capturing_window",
  SWITCH_CANCEL = "switch_cancel",
  SELECT_CAPTURING_WINDOW = "select_capturing_window",
  PAUSE_CAPTURE = "pause_capture",
  RESUME_CAPTURE = "resume_capture",
  RUN_OPERATION = "run_operation",
  AUTOFILL = "autofill",
}

/**
 * The Socket.IO event that is sent to client from server.
 */
enum ServerToClientSocketIOEvent {
  CAPTURE_STARTED = "capture_started",
  OPERATION_CAPTURED = "operation_captured",
  SCREEN_TRANSITION_CAPTURED = "screen_transition_captured",
  SCREENSHOT_TAKEN = "screenshot_taken",
  BROWSER_HISTORY_CHANGED = "browser_history_changed",
  BROWSER_WINDOWS_CHANGED = "browser_windows_changed",
  ALERT_VISIBLE_CHANGED = "alert_visibility_changed",
  CAPTURE_PAUSED = "capture_paused",
  CAPTURE_RESUMED = "capture_resumed",
  RUN_OPERATION_COMPLETED = "run_operation_completed",
  AUTOFILL_COMPLETED = "autofill_completed",
  RUN_OPERATION_AND_SCREEN_TRANSITION_COMPLETED = "run_operation_and_screen_transition_completed",
  INVALID_OPERATION = "invalid_operation",
  ERROR_OCCURRED = "error_occurred",
}

LoggingService.initialize(
  new StandardLogger(
    RunningMode.Debug,
    path.join(appRootPath, "logs", "latteart-capture-cl.log")
  )
);

const v1RootPath = "/api/v1";
/**
 * Get connected mobile devices.
 */
app.get(`${v1RootPath}/devices`, (req, res) => {
  LoggingService.info("Detecting devices.");

  (async () => {
    try {
      const devices = [
        ...(await new AndroidDeviceAccessor().getDevices()),
        ...(await new IOSDeviceAccessor().getDevices()),
      ];

      LoggingService.info("Devices detected.");

      res.json(devices);
    } catch (error) {
      if (!(error instanceof Error)) {
        throw error;
      }
      LoggingService.error("Detect devices failed.", error);

      const serverError: ServerError = {
        code: ServerErrorCode.DETECT_DEVICES_FAILED,
        message: "Detect devices failed.",
      };

      res.status(500).json(serverError);
    }
  })();
});

/**
 * Get server name.
 */
app.get(`${v1RootPath}/server-name`, (req, res) => {
  LoggingService.info("Get server name.");

  res.json("latteart-capture-cl");
});

socket.on("connection", (socket) => {
  LoggingService.info("Socket connected.");

  let capturer: BrowserOperationCapturer;
  let client: WebDriverClient;

  /**
   * Start capture.
   */
  socket.on(
    ClientToServerSocketIOEvent.START_CAPTURE,
    async (url: string, config = "{}") => {
      LoggingService.info("Start capture.");

      const captureConfig = new CaptureConfig(JSON.parse(config));

      const { server, error: setupError } = await setupWebDriverServer(
        captureConfig
      );

      if (setupError) {
        socket.emit(
          ServerToClientSocketIOEvent.ERROR_OCCURRED,
          JSON.stringify(setupError)
        );

        socket.disconnect();
        return;
      }

      const parsedUrl = JSON.parse(url);

      try {
        client = await new WebDriverClientFactory().create({
          platformName: captureConfig.platformName,
          browserName: captureConfig.browserName,
          device: captureConfig.device,
          browserBinaryPath: "",
          webDriverServer: server,
          isHeadlessMode: captureConfig.isHeadlessMode,
        });

        capturer = new BrowserOperationCapturer(client, captureConfig, {
          onGetOperation: (operation) => {
            socket.emit(
              ServerToClientSocketIOEvent.OPERATION_CAPTURED,
              JSON.stringify(operation)
            );
          },
          onGetScreenTransition: (screenTransition) => {
            socket.emit(
              ServerToClientSocketIOEvent.SCREEN_TRANSITION_CAPTURED,
              JSON.stringify(screenTransition)
            );
            socket.emit(
              ServerToClientSocketIOEvent.RUN_OPERATION_AND_SCREEN_TRANSITION_COMPLETED
            );
          },
          onBrowserClosed: () => {
            capturer.resumeCapturing();

            LoggingService.info("Browser closed.");
          },
          onBrowserHistoryChanged: (browserStatus: {
            canGoBack: boolean;
            canGoForward: boolean;
          }) => {
            LoggingService.info("Browser history changed.");
            socket.emit(
              ServerToClientSocketIOEvent.BROWSER_HISTORY_CHANGED,
              JSON.stringify(browserStatus)
            );
          },
          onBrowserWindowsChanged: (
            windowHandles: string[],
            currentWindowHandle: string
          ) => {
            LoggingService.info("Browser windows changed.");

            const windowsInfo = JSON.stringify({
              windowHandles,
              currentWindowHandle,
            });
            LoggingService.debug(windowsInfo);
            socket.emit(
              ServerToClientSocketIOEvent.BROWSER_WINDOWS_CHANGED,
              windowsInfo
            );
          },
          onAlertVisibilityChanged: (isVisible: boolean) => {
            socket.emit(
              ServerToClientSocketIOEvent.ALERT_VISIBLE_CHANGED,
              JSON.stringify({ isVisible: isVisible })
            );
          },
          onError: (error: Error) => {
            LoggingService.error("Capture failed.", error);

            const serverError: ServerError = {
              code: ServerErrorCode.CAPTURE_FAILED,
              message: "Capture failed.",
            };

            socket.emit(
              ServerToClientSocketIOEvent.ERROR_OCCURRED,
              JSON.stringify(serverError)
            );
          },
        });

        socket.on(ClientToServerSocketIOEvent.STOP_CAPTURE, async () => {
          capturer.quit();
        });
        socket.on(ClientToServerSocketIOEvent.TAKE_SCREENSHOT, async () => {
          const screenshot = await capturer.getScreenshot();

          socket.emit(ServerToClientSocketIOEvent.SCREENSHOT_TAKEN, screenshot);
        });
        socket.on(ClientToServerSocketIOEvent.BROWSER_BACK, () => {
          capturer.browserBack();
        });
        socket.on(ClientToServerSocketIOEvent.BROWSER_FORWARD, () => {
          capturer.browserForward();
        });
        socket.on(
          ClientToServerSocketIOEvent.SWITCH_CAPTURING_WINDOW,
          async (destWindowHandle: string) => {
            capturer.switchCapturingWindow(JSON.parse(destWindowHandle));
          }
        );
        socket.on(ClientToServerSocketIOEvent.SWITCH_CANCEL, async () => {
          capturer.switchCancel();
        });
        socket.on(
          ClientToServerSocketIOEvent.SELECT_CAPTURING_WINDOW,
          async () => {
            capturer.selectCapturingWindow();
          }
        );
        socket.on(ClientToServerSocketIOEvent.PAUSE_CAPTURE, async () => {
          await capturer.pauseCapturing();

          socket.emit(ServerToClientSocketIOEvent.CAPTURE_PAUSED);
        });
        socket.on(ClientToServerSocketIOEvent.RESUME_CAPTURE, async () => {
          await capturer.resumeCapturing();

          socket.emit(ServerToClientSocketIOEvent.CAPTURE_RESUMED);
        });
        socket.on(
          ClientToServerSocketIOEvent.AUTOFILL,
          async (inputValueSets: string) => {
            try {
              await capturer.autofill(JSON.parse(inputValueSets));
              socket.emit(ServerToClientSocketIOEvent.AUTOFILL_COMPLETED);
            } catch (e) {
              if (e instanceof Error) {
                LoggingService.error("Autofill failed.", e);
              }
            }
          }
        );
        socket.on(
          ClientToServerSocketIOEvent.RUN_OPERATION,
          async (operation: string) => {
            LoggingService.info("Run operation.");
            LoggingService.debug(operation);

            const targetOperation: Operation = JSON.parse(operation);
            try {
              await capturer.runOperation(targetOperation);
              socket.emit(ServerToClientSocketIOEvent.RUN_OPERATION_COMPLETED);
            } catch (error) {
              if (!(error instanceof Error)) {
                throw error;
              }
              if (error.message === "InvalidOperationError") {
                const serverError: ServerError = {
                  code: ServerErrorCode.INVALID_OPERATION,
                  message: "Invalid operation.",
                };
                socket.emit(
                  ServerToClientSocketIOEvent.ERROR_OCCURRED,
                  JSON.stringify(serverError)
                );
              }
            }
          }
        );

        await capturer.start(parsedUrl, () => {
          socket.emit(
            ServerToClientSocketIOEvent.CAPTURE_STARTED,
            new TimestampImpl().epochMilliseconds().toString()
          );
        });
      } catch (error) {
        if (!(error instanceof Error)) {
          throw error;
        }

        if (error.name === "InvalidArgumentError") {
          LoggingService.error(`Invalid url.: ${parsedUrl}`);

          const serverError: ServerError = {
            code: ServerErrorCode.INVALID_URL,
            message: "Invalid url.",
          };

          socket.emit(
            ServerToClientSocketIOEvent.ERROR_OCCURRED,
            JSON.stringify(serverError)
          );

          return;
        }

        if (
          error.name === "SessionNotCreatedError" &&
          error.message.includes(
            "This version of ChromeDriver only supports Chrome version"
          )
        ) {
          LoggingService.error("WebDriver version mismatch.", error);

          const serverError: ServerError = {
            code: ServerErrorCode.WEB_DRIVER_VERSION_MISMATCH,
            message: "WebDriver version mismatch.",
          };

          socket.emit(
            ServerToClientSocketIOEvent.ERROR_OCCURRED,
            JSON.stringify(serverError)
          );

          return;
        }

        // Other errors.
        LoggingService.error("An unknown error has occurred.", error);

        const serverError: ServerError = {
          code: ServerErrorCode.UNKNOWN_ERROR,
          message: "An unknown error has occurred.",
        };

        socket.emit(
          ServerToClientSocketIOEvent.ERROR_OCCURRED,
          JSON.stringify(serverError)
        );
      } finally {
        server.kill();
        socket.disconnect();
      }
    }
  );

  socket.on("disconnect", (reason: string) => {
    capturer?.quit();

    if (reason === "ping timeout") {
      LoggingService.warn("Socket ping timeout.");
    }

    if (reason === "transport close") {
      LoggingService.warn("Socket transport close.");
    }

    if (reason === "transport error") {
      LoggingService.warn("Socket transport error.");
    }

    LoggingService.info("Socket disconnected.");
  });
});

const port = process.env.PORT || 3001;

server.listen(port, () => {
  LoggingService.info(`Listening on *:${port}`);
});
