import OperationHistoryRunner from "@/runner/BrowserOperationRunner";
import { Operation } from "@/Operation";

describe("OperationHistoryRunnerは", () => {
  describe("createRecordedWindowHandleMapで", () => {
    it("operationsからwindowhandleMapを作成する", () => {
      const operations = [
        new Operation({ windowHandle: "windowhandle1" }),
        new Operation({ windowHandle: "windowhandle3" }),
        new Operation({ windowHandle: "windowhandle2" }),
        new Operation({ windowHandle: "windowhandle1" }),
        new Operation({ windowHandle: "windowhandle3" }),
        new Operation({ windowHandle: "windowhandle2" }),
      ];

      const windowHandleMap = OperationHistoryRunner.createRecordedWindowHandleMap(
        operations as Operation[]
      );
      expect(windowHandleMap).toEqual(
        new Map([
          [0, "windowhandle1"],
          [1, "windowhandle3"],
          [2, "windowhandle2"],
        ])
      );
    });
  });

  describe("updateReplayWindowHandleMapで", () => {
    it("windowhandlesからwindowhandleMapにwindowhandleを追加する", () => {
      const windowHandles = [
        "windowhandle1",
        "windowhandle3",
        "windowhandle2",
        "windowhandle1",
        "windowhandle3",
        "windowhandle2",
      ];
      const windowHandleMap = new Map<number, string>();
      const counterObj = { counter: 0 };
      OperationHistoryRunner.updateReplayWindowHandleMap(
        windowHandles,
        windowHandleMap,
        counterObj
      );
      expect(windowHandleMap).toEqual(
        new Map([
          [0, "windowhandle1"],
          [1, "windowhandle3"],
          [2, "windowhandle2"],
        ])
      );
    });
  });
  describe("getHandleKeyで", () => {
    const windowHandleMap = new Map([
      [0, "windowhandle1"],
      [1, "windowhandle3"],
      [2, "windowhandle2"],
    ]);

    it("windowhandleMapから対象のkeyを取得する", () => {
      const windowhandle = "windowhandle3";
      expect(
        OperationHistoryRunner.getHandleKey(windowhandle, windowHandleMap)
      ).toEqual(1);
    });
    it("対象のキーが存在しない", () => {
      const windowhandle = "windowhandle4";
      expect(
        OperationHistoryRunner.getHandleKey(windowhandle, windowHandleMap)
      ).toEqual(-1);
    });
  });
});
