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
  * Development mirror of `v3-prototype` branch: https://preview.ideditor.com/master

Come on in, the water's lovely. More help? Ping `Martin Raifer`/`tyr_asd` or `bhousel` on:
* [OpenStreetMap US Slack](https://slack.openstreetmap.us/) (`#id` channel)
* [OpenStreetMap Discord](https://discord.gg/openstreetmap) (`#id` channel)
* [OpenStreetMap IRC](https://wiki.openstreetmap.org/wiki/IRC) (`irc.oftc.net`, in `#osm-dev`)
* [OpenStreetMap `dev` mailing list](https://wiki.openstreetmap.org/wiki/Mailing_lists)

## Prerequisites

* [Node.js](https://nodejs.org/) version 16.14 or newer
* [`git`](https://www.atlassian.com/git/tutorials/install-git/) for your platform
  * Note for Windows users:
    * Edit `$HOME\.gitconfig`:<br/>
      Add these lines to avoid checking in files with CRLF newlines<br><pre>
      [core]
          autocrlf = input</pre>

## Installation

Note: Windows users should run these steps in a shell started with "Run as administrator".
This is only necessary the first time so that the build process can create symbolic links.

To run the current development version of iD on your own computer:

#### Cloning the repository

The repository is reasonably large, and it's unlikely that you need the full history (~200 MB). If you are happy to wait for it all to download, run:

```
git clone https://github.com/openstreetmap/iD.git
```

To clone only the most recent version, instead use a 'shallow clone':

```
git clone --depth=1 https://github.com/openstreetmap/iD.git
```

If you want to add in the full history later on, perhaps to run `git blame` or `git log`, run `git fetch --depth=1000000`

#### Building iD

1. `cd` into the newly cloned project folder
2. Run `npm install`
3. Run `npm run all`
3. Run `npm start`
4. Open `http://127.0.0.1:8080/` in a web browser

For guidance on building a packaged version, running tests, and contributing to
development, see [CONTRIBUTING.md](CONTRIBUTING.md).


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
* [Mapillary JS (MIT)](https://github.com/mapillary/mapillary-js)
* [iD Tagging Schema (ISC)](https://github.com/openstreetmap/id-tagging-schema)
* [name-suggestion-index (BSD-3-Clause)](https://github.com/osmlab/name-suggestion-index)
* [osm-community-index (ISC)](https://github.com/osmlab/osm-community-index)


## Thank you

Initial development of iD was made possible by a [grant of the Knight Foundation](https://www.mapbox.com/blog/knight-invests-openstreetmap/).
