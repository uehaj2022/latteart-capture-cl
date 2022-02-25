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
 * Server error code.
 */
export enum ServerErrorCode {
  DETECT_DEVICES_FAILED = "detect_devices_failed",
  CAPTURE_FAILED = "capture_failed",
  UNKNOWN_ERROR = "unknown_error",
  INVALID_URL = "invalid_url",
  WEB_DRIVER_VERSION_MISMATCH = "web_driver_version_mismatch",
  RUN_OPERATIONS_FAILED = "run_operations_failed",
  WEB_DRIVER_NOT_READY = "web_driver_not_ready",
  APPIUM_NOT_STARTED = "appium_not_started",
  DEVICE_NOT_CONNECTED = "device_not_connected",
}

/**
 * Server error.
 */
export interface ServerError {
  /**
   * Error code.
   */
  code: string;

  /**
   * Error message.
   */
  message: string;

  /**
   * details.
   */
  details?: Array<{
    /**
     * Error code.
     */
    code: string;

    /**
     * Error message.
     */
    message: string;

    /**
     * Error location.
     */
    target: string;
  }>;
}
