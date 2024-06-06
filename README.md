# iD - friendly JavaScript editor for [OpenStreetMap](https://www.openstreetmap.org/)

[![build](https://github.com/openstreetmap/iD/workflows/build/badge.svg)](https://github.com/openstreetmap/iD/actions?query=workflow%3A%22build%22)

## Basics

* iD is a JavaScript [OpenStreetMap](https://www.openstreetmap.org/) editor.
* It's intentionally simple. It lets you do the most basic tasks while not breaking other people's data.
* It supports all popular modern desktop browsers: Chrome, Firefox, Safari, Opera, and Edge.
* iD is not yet designed for mobile browsers, but this is something we hope to add!
* Data is rendered with [d3.js](https://d3js.org/).

## Participate!

* Read the project [Code of Conduct](CODE_OF_CONDUCT.md) and remember to be nice to one another.
* Read up on [Contributing and the code style of iD](CONTRIBUTING.md).
* See [open issues in the issue tracker](https://github.com/openstreetmap/iD/issues?state=open)
if you're looking for something to do.
* [Translate!](https://github.com/openstreetmap/iD/blob/develop/CONTRIBUTING.md#translating)
* Test a prerelease version of iD:
  * Stable mirror of `release` branch: https://ideditor-release.netlify.app
  * Development mirror of `develop` branch + latest translations: https://ideditor.netlify.app

Come on in, the water's lovely. More help? Ping `Martin Raifer`/`tyr_asd` or `bhousel` on:
* [OpenStreetMap US Slack](https://slack.openstreetmap.us/) (`#id` channel)
* [OpenStreetMap Discord](https://discord.gg/openstreetmap) (`#id` channel)
* [OpenStreetMap IRC](https://wiki.openstreetmap.org/wiki/IRC) (`irc.oftc.net`, in `#osm-dev`)
* [OpenStreetMap `dev` mailing list](https://wiki.openstreetmap.org/wiki/Mailing_lists)

## Installation

Follow the steps in the [how to get started guide](https://github.com/openstreetmap/iD/wiki/How-to-get-started#build-and-test-instructions) on how to install, build and run iD locally.

## License

iD is available under the [ISC License](https://opensource.org/licenses/ISC).
See the [LICENSE.md](LICENSE.md) file for more details.

iD also bundles portions of the following open source software.

* [D3.js (BSD-3-Clause)](https://github.com/d3/d3)
* [CLDR (Unicode Consortium Terms of Use)](https://github.com/unicode-cldr/cldr-json)
* [editor-layer-index (CC-BY-SA 3.0)](https://github.com/osmlab/editor-layer-index)
* [Font Awesome (CC-BY 4.0)](https://fontawesome.com/license)
* [Maki (CC0 1.0)](https://github.com/mapbox/maki)
* [Temaki (CC0 1.0)](https://github.com/ideditor/temaki)
* [Röntgen icon set (CC-BY 4.0)](https://github.com/enzet/map-machine#r%C3%B6ntgen-icon-set)
* [Mapillary JS (MIT)](https://github.com/mapillary/mapillary-js)
* [iD Tagging Schema (ISC)](https://github.com/openstreetmap/id-tagging-schema)
* [name-suggestion-index (BSD-3-Clause)](https://github.com/osmlab/name-suggestion-index)
* [osm-community-index (ISC)](https://github.com/osmlab/osm-community-index)


## Thank you

Initial development of iD was made possible by a [grant of the Knight Foundation](https://www.mapbox.com/blog/knight-invests-openstreetmap/).



### 建置與測試指南

### 安裝
若要在您自己的電腦上運行 iD 的當前開發版本，請執行以下操作：

### 克隆存儲庫
存儲庫相對較大，完整的歷史記錄大約需要200MB。如果您不介意等待所有數據下載，可以運行：

**git clone https://github.com/openstreetmap/iD.git**

如果您只想克隆最新版本，請使用「淺克隆」：

**git clone --depth=1 https://github.com/openstreetmap/iD.git**

如果稍後想添加完整的歷史記錄，以便運行 git blame 或 git log，可以運行：

**git fetch --depth=1000000**

### 構建 iD
1. 進入新克隆的項目文件夾
2. 運行 npm install
3. 運行 npm run all
4. 運行 npm start
5. 在網頁瀏覽器中打開 http://127.0.0.1:8080/

最後更新：24 年 6 月 5 日
