import Autofill, { InputValueSet } from "@/webdriver/autofill";

describe("Autofill", () => {
  const currentWindow: any = {
    sleep: jest.fn().mockResolvedValue(0),
    focus: jest.fn().mockResolvedValue(0),
  };

  describe("#execute", () => {
    it("selectboxに値を設定", async () => {
      const client: any = {};
      const inputValueSets: InputValueSet[] = [
        {
          locatorType: "id",
          locator: "locator",
          locatorMatchType: "equals",
          inputValue: "toSelect",
        },
      ];

      const webElementMock = {
        getTagName: () => "select",
      };
      const autofill = new Autofill(client, inputValueSets, currentWindow);
      (autofill["getWebElements"] as jest.Mock) = jest
        .fn()
        .mockResolvedValue([webElementMock]);
      (autofill.setValueToSelectbox as jest.Mock) = jest.fn();

      await autofill.execute();

      expect(autofill.setValueToSelectbox).toHaveBeenCalledWith(
        webElementMock,
        "toSelect"
      );
    });

    it("textareaに値を設定", async () => {
      const client: any = {};
      const inputValueSets: InputValueSet[] = [
        {
          locatorType: "id",
          locator: "locator",
          locatorMatchType: "equals",
          inputValue: "toTextArea",
        },
      ];

      const webElementMock = {
        getTagName: () => "textarea",
      };
      const autofill = new Autofill(client, inputValueSets, currentWindow);
      (autofill["getWebElements"] as jest.Mock) = jest
        .fn()
        .mockResolvedValue([webElementMock]);
      (autofill.setValueToText as jest.Mock) = jest.fn();

      await autofill.execute();

      expect(autofill.setValueToText).toHaveBeenCalledWith(
        webElementMock,
        "toTextArea"
      );
    });

    it("checkboxに値を設定", async () => {
      const client: any = {};
      const inputValueSets: InputValueSet[] = [
        {
          locatorType: "id",
          locator: "locator",
          locatorMatchType: "equals",
          inputValue: "on",
        },
      ];

      const webElementMock = {
        getTagName: () => "input",
        getAttribute: () => "checkbox",
      };
      const autofill = new Autofill(client, inputValueSets, currentWindow);
      (autofill["getWebElements"] as jest.Mock) = jest
        .fn()
        .mockResolvedValue([webElementMock]);
      (autofill.setValueToCheckbox as jest.Mock) = jest.fn();

      await autofill.execute();

      expect(autofill.setValueToCheckbox).toHaveBeenCalledWith(
        webElementMock,
        "on"
      );
    });

    it("radioに値を設定", async () => {
      const client: any = {};
      const inputValueSets: InputValueSet[] = [
        {
          locatorType: "id",
          locator: "locator",
          locatorMatchType: "equals",
          inputValue: "on",
        },
      ];

      const webElementMock = {
        getTagName: () => "input",
        getAttribute: () => "radio",
      };
      const autofill = new Autofill(client, inputValueSets, currentWindow);
      (autofill["getWebElements"] as jest.Mock) = jest
        .fn()
        .mockResolvedValue([webElementMock]);
      (autofill.setValueToRadiobutton as jest.Mock) = jest.fn();

      await autofill.execute();

      expect(autofill.setValueToRadiobutton).toHaveBeenCalledWith(
        webElementMock,
        "on"
      );
    });

    it("dateに値を設定", async () => {
      const client: any = {};
      const inputValueSets: InputValueSet[] = [
        {
          locatorType: "id",
          locator: "locator",
          locatorMatchType: "equals",
          inputValue: "002020-02-02",
        },
      ];

      const webElementMock = {
        getTagName: () => "input",
        getAttribute: () => "date",
      };
      const autofill = new Autofill(client, inputValueSets, currentWindow);
      (autofill["getWebElements"] as jest.Mock) = jest
        .fn()
        .mockResolvedValue([webElementMock]);
      (autofill.setValueToDate as jest.Mock) = jest.fn();

      await autofill.execute();

      expect(autofill.setValueToDate).toHaveBeenCalledWith(
        webElementMock,
        "002020-02-02"
      );
    });

    it("textに値を設定", async () => {
      const client: any = {};
      const inputValueSets: InputValueSet[] = [
        {
          locatorType: "id",
          locator: "locator",
          locatorMatchType: "equals",
          inputValue: "aaa",
        },
      ];

      const webElementMock = {
        getTagName: () => "input",
        getAttribute: () => "text",
      };
      const autofill = new Autofill(client, inputValueSets, currentWindow);
      (autofill["getWebElements"] as jest.Mock) = jest
        .fn()
        .mockResolvedValue([webElementMock]);
      (autofill.setValueToText as jest.Mock) = jest.fn();

      await autofill.execute();

      expect(autofill.setValueToText).toHaveBeenCalledWith(
        webElementMock,
        "aaa"
      );
    });
  });
  describe("#extractIdSetFromPageSource", () => {
    it("id抽出", async () => {
      const client: any = {};
      const inputValueSets: InputValueSet[] = [];

      const autofill = new Autofill(client, inputValueSets, currentWindow);
      const pageSource = `
      <html>
        <body>
          <div id="aaa">
            <span id="b-b">xxx</span>
            <span>xxx</span>
          </div>
          <div>
            <p>xxxx</span>
          <div>
          <div id='c_c'>
            <span id="_DD1">xxx</span>
          </div>
        </body>
      </html>
      `;

      const idSet = autofill.extractIdSetFromPageSource(pageSource);

      expect(idSet).toEqual(new Set(["aaa", "b-b", "c_c", "_DD1"]));
    });
  });
  describe("#getWebElements", () => {
    it("一致するid要素を取得", async () => {
      const webElementMock = { dummy: "dummy" };
      const client: any = {
        getElementById: jest.fn().mockResolvedValue(webElementMock),
      };
      const inputValueSets: InputValueSet[] = [];

      const autofill = new Autofill(client, inputValueSets, currentWindow);
      const result = await (autofill as any).getWebElements(
        "id",
        "locator",
        "equals"
      );

      expect(client.getElementById).toHaveBeenCalledWith("locator");
      expect(result).toEqual([webElementMock]);
    });
    it("一致するxpath要素を取得", async () => {
      const webElementMock = { dummy: "dummy" };
      const client: any = {
        getElementByXpath: jest.fn().mockResolvedValue(webElementMock),
      };
      const inputValueSets: InputValueSet[] = [];

      const autofill = new Autofill(client, inputValueSets, currentWindow);
      const result = await (autofill as any).getWebElements(
        "xpath",
        "locator",
        "equals"
      );

      expect(client.getElementByXpath).toHaveBeenCalledWith("locator");
      expect(result).toEqual([webElementMock]);
    });

    it("正規表現にマッチするid要素を取得", async () => {
      const webElementMock = [{ dummy: "dummy1" }, { dummy: "dummy2" }];
      const client: any = {};
      const inputValueSets: InputValueSet[] = [];

      const autofill = new Autofill(client, inputValueSets, currentWindow);
      (autofill["getWebElementsByRegexId"] as any) = jest
        .fn()
        .mockResolvedValue(webElementMock);

      const result = await (autofill as any).getWebElements(
        "id",
        "locator",
        "regex"
      );

      expect(autofill["getWebElementsByRegexId"]).toHaveBeenCalledWith(
        "locator"
      );
      expect(result).toEqual(webElementMock);
    });

    it("正規表現にマッチするxpath要素を取得", async () => {
      const webElementMock = [{ dummy: "dummy1" }, { dummy: "dummy2" }];
      const client: any = {};
      const inputValueSets: InputValueSet[] = [];

      const autofill = new Autofill(client, inputValueSets, currentWindow);
      (autofill["getWebElementsByRegexXpath"] as any) = jest
        .fn()
        .mockResolvedValue(webElementMock);

      const result = await (autofill as any).getWebElements(
        "xpath",
        "locator",
        "regex"
      );

      expect(autofill["getWebElementsByRegexXpath"]).toHaveBeenCalledWith(
        "locator"
      );
      expect(result).toEqual(webElementMock);
    });
  });

  describe("#getWebElementsByRegexId", () => {
    it("idSet無し、pageSource無しの場合", async () => {
      const webElementMock = {};
      const client: any = {
        getCurrentPageSource: jest
          .fn()
          .mockResolvedValue(
            "<html><body><div id='abc'>aa</div></body></html>"
          ),
        getElementById: jest.fn().mockResolvedValue(webElementMock),
      };
      const inputValueSets: InputValueSet[] = [];

      const autofill = new Autofill(client, inputValueSets, currentWindow);

      const result = await (autofill as any).getWebElementsByRegexId("a.+c");

      expect(client.getCurrentPageSource).toBeCalled();
      expect(client.getElementById).toHaveBeenCalledWith("abc");
      expect(result[0]).toEqual(webElementMock);
    });

    it("idSet有りの場合", async () => {
      const webElementMock = {};
      const client: any = {
        getElementById: jest.fn().mockResolvedValue(webElementMock),
      };
      const inputValueSets: InputValueSet[] = [];

      const autofill = new Autofill(client, inputValueSets, currentWindow);
      (autofill as any).idSet = new Set(["abc"]);

      const result = await (autofill as any).getWebElementsByRegexId("a.+c");

      expect(client.getElementById).toHaveBeenCalledWith("abc");
      expect(result[0]).toEqual(webElementMock);
    });
  });

  describe("#getWebElementsByRegexXpath", () => {
    it("xpathList無し、pageSource無しの場合", async () => {
      const webElementMock = {};
      const client: any = {
        getCurrentPageSource: jest
          .fn()
          .mockResolvedValue("<html><body><div>aa</div></body></html>"),
        getElementByXpath: jest.fn().mockResolvedValue(webElementMock),
      };
      const inputValueSets: InputValueSet[] = [];

      const autofill = new Autofill(client, inputValueSets, currentWindow);

      const result = await (autofill as any).getWebElementsByRegexXpath(
        "/html/body/.*"
      );

      expect(client.getCurrentPageSource).toBeCalled();
      expect(client.getElementByXpath).toHaveBeenCalledWith("/html/body/div");
      expect(result[0]).toEqual(webElementMock);
    });

    it("xpathList有りの場合", async () => {
      const webElementMock = {};
      const client: any = {
        getElementByXpath: jest.fn().mockResolvedValue(webElementMock),
      };
      const inputValueSets: InputValueSet[] = [];

      const autofill = new Autofill(client, inputValueSets, currentWindow);
      (autofill as any).xpathList = ["/html/body/div"];

      const result = await (autofill as any).getWebElementsByRegexXpath(
        "/html/body/.*"
      );

      expect(client.getElementByXpath).toHaveBeenCalledWith("/html/body/div");
      expect(result[0]).toEqual(webElementMock);
    });
  });

  describe("#getAllXpath", () => {
    it("xpathのリストを取得", () => {
      const client: any = {};
      const inputValueSets: InputValueSet[] = [];

      const autofill = new Autofill(client, inputValueSets, currentWindow);

      const pageSource = `
      <html>
        <body>
          <div>
            <form>
              <input type="text" />
              <input type="radio" name="aGroup" id="a"><label for="a">A</label>
              <input type="radio" name="aGroup" id="b"><label for="b">B</label>
            </form>
            <div>
              <span>aaa</span>
            </div>
          </div>
        </body>
      </html>
      `;

      const result = (autofill as any).getAllXpath(pageSource);

      expect(result).toEqual([
        "/html/body/div/form/input[1]",
        "/html/body/div/form/input[2]",
        "/html/body/div/form/label[1]",
        "/html/body/div/form/input[3]",
        "/html/body/div/form/label[2]",
        "/html/body/div/div/span",
      ]);
    });
  });
});
