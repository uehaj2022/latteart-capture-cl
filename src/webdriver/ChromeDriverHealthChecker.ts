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

import { get } from "http";

export const CHROME_DRIVER_SERVER_URL = "http://127.0.0.1:9515/status";

/**
 * ChromeDriver health checker.
 */
export default class ChromeDriverHealthChecker {
  /**
   * Whether ChromeDriver server is started or not.
   * @returns 'true': ChromeDriver server is started, 'false': ChromeDriver server is not started.
   */
  public static async chromeDriverIsStarted(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const request = get(CHROME_DRIVER_SERVER_URL, () => {
        resolve(true);
      });
      request.on("error", () => {
        resolve(false);
      });
    });
  }
}
