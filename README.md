# iD - friendly JavaScript editor for [OpenStreetMap](https://www.openstreetmap.org/)

[![Build Status](https://travis-ci.org/openstreetmap/iD.svg?branch=master)](https://travis-ci.org/openstreetmap/iD)
[![Greenkeeper badge](https://badges.greenkeeper.io/openstreetmap/iD.svg)](https://greenkeeper.io/)

## Basics

* iD is a JavaScript [OpenStreetMap](https://www.openstreetmap.org/) editor.
* It's intentionally simple. It lets you do the most basic tasks while
  not breaking other people's data.
* It supports all popular modern desktop browsers: Chrome, Firefox, Safari,
  Opera, Edge, and IE11.
* iD is not yet designed for mobile browsers, but this is something we hope to add!
* Data is rendered with [d3.js](https://d3js.org/).

## Participate!

* Read the project [Code of Conduct](CODE_OF_CONDUCT.md) and remember to be nice to one another.
* Read up on [Contributing and the code style of iD](CONTRIBUTING.md).
* See [open issues in the issue tracker](https://github.com/openstreetmap/iD/issues?state=open)
if you're looking for something to do.
* [Translate!](https://github.com/openstreetmap/iD/blob/master/CONTRIBUTING.md#translating)
* Test a prerelease version of iD:
  * Stable mirror of `release` branch:  http://preview.ideditor.com/release
  * Development mirror of `master` branch + latest translations:  http://preview.ideditor.com/master

Come on in, the water's lovely. More help? Ping `jfire` or `bhousel` on:
* [OpenStreetMap US Slack](https://osmus-slack.herokuapp.com/)
(`#dev` or `#general` channels)
* [OpenStreetMap IRC](https://wiki.openstreetmap.org/wiki/IRC)
(`irc.oftc.net`, in `#iD` or `#osm-dev` or `#osm`)
* [OpenStreetMap `dev` mailing list](https://wiki.openstreetmap.org/wiki/Mailing_lists)

## Prerequisites

* [Node.js](https://nodejs.org/) version 6 or newer
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

The repository is reasonably large, and it's unlikely that you need the full history. If you are happy to wait for it all to download, run:

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
4. Open `http://localhost:8080/` in a web browser

For guidance on building a packaged version, running tests, and contributing to
development, see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

iD is available under the [ISC License](https://opensource.org/licenses/ISC).
See the [LICENSE.md](LICENSE.md) file for more details.

## Thank you

Initial development of iD was made possible by a [grant of the Knight Foundation](https://www.mapbox.com/blog/knight-invests-openstreetmap/).
