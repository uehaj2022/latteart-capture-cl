# LatteArt Capture CL

LatteArt で利用する操作履歴を取得するサービスです。

WebDriver を利用して Web ブラウザに対するユーザ操作を取得します。

## プロジェクトセットアップ

1. `node.js v14.15.3`をインストールします。
1. 上記バージョンの node.js に対応した`yarn`をインストールします。
1. ソースコードのルートディレクトリに移動します。
1. 以下コマンドを実行します。

   ```bash
   yarn install
   ```

## ビルド

1. ソースコードのルートディレクトリに移動します。
1. 以下コマンドを実行します。
   ```bash
   yarn package
   ```
1. `dist/latteart-capture-cl`に以下構成のディレクトリが作成されます。
   ```bash
   dist/latteart-capture-cl
       ├─ latteart-capture-cl.exe # Windows用実行ファイル
       └─ latteart-capture-cl # Mac用実行ファイル
   ```

## ウォッチ(開発用)

ソースコードの変更を検知して再ビルドします。

1. ソースコードのルートディレクトリに移動します。
1. 以下コマンドを実行します。
   ```bash
   yarn watch
   ```
1. カレントディレクトリに`dist`ディレクトリが作成され、配下にビルドされた`index.js`が出力されます(以降ソースコードを修正すると自動的に再ビルドされます)。

## 起動

### 事前準備

1. 実行端末に以下をインストールし、パスを通します。
   - テスト対象のプラットフォームが PC の場合
     1. テスト対象の chrome のバージョンに対応する`chromedriver`
     1. `cwebp`
   - テスト対象のプラットフォームが Android の場合
     1. テスト対象の chrome のバージョンに対応する`chromedriver`
     1. `cwebp`
     1. `adb`
     1. `Appium`
1. テスト対象のプラットフォームが PC 以外の場合は Appium サーバを起動します。

### 手順

1. ビルドで出力された実行ファイルをダブルクリック等で実行します。
1. ローカルサーバが立ち上がり、`http://127.0.0.1:3001`で待ち受けます。

## License

This software is licensed under the Apache License, Version2.0.
