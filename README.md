# iD - friendly JavaScript editor for [OpenStreetMap](http://www.openstreetmap.org/)

[![Build Status](https://travis-ci.org/openstreetmap/iD.svg?branch=master)](https://travis-ci.org/openstreetmap/iD)

## Basics

* iD is a JavaScript [OpenStreetMap](http://www.openstreetmap.org/) editor.
* It's intentionally simple. It lets you do the most basic tasks while
  not breaking other people's data.
* It supports all popular modern desktop browsers: Chrome, Firefox, Safari,
  Opera, Edge, and IE11.
* iD is not yet designed for mobile browsers, but this is something we hope to add!
* Data is rendered with [d3.js](http://d3js.org/).

## Participate!

* Read the project [Code of Conduct](CODE_OF_CONDUCT.md) and remember to be nice to one another.
* Read up on [Contributing and the code style of iD](CONTRIBUTING.md).
* See [open issues in the issue tracker](https://github.com/openstreetmap/iD/issues?state=open) if you're looking for something to do.
* [Translate!](https://github.com/openstreetmap/iD/blob/master/CONTRIBUTING.md#translating)
* Test a prerelease version of iD:
  * Stable mirror of `release` branch:  http://openstreetmap.us/iD/release
  * Development mirror of `master` branch:  http://openstreetmap.us/iD/master

Come on in, the water's lovely. More help? Ping `jfire` or `bhousel` on:
* [OpenStreetMap US Slack](https://osmus-slack.herokuapp.com/)
(`#dev` or `#general` channels)
* [OpenStreetMap IRC](http://wiki.openstreetmap.org/wiki/IRC)
(`irc.oftc.net`, in `#iD` or `#osm-dev` or `#osm`)
* [OpenStreetMap `dev` mailing list](http://wiki.openstreetmap.org/wiki/Mailing_lists)

## Prerequisites

* [Node.js](http://nodejs.org/) version 4 or newer
* [`git`](https://www.atlassian.com/git/tutorials/install-git/) for your platform
  * Note for Windows users:
    * Edit `$HOME\.gitconfig`:<br/>
      Add these lines to avoid checking in files with CRLF newlines<br><pre>
      [core]
          autocrlf = input</pre>

## Installation

To run the current development version of iD on your own computer:

1. Create a local `git clone` of the project, then `cd` into the project folder
2. (Windows Only)  Run `fixWinSymlinks.bat`.  This script will prompt for Administrator rights.  see also: http://stackoverflow.com/questions/5917249/git-symlinks-in-windows
3. Run `npm install`  (this will run the `prepublish` script that builds everything)
4. Run `npm start`
5. Open `http://localhost:8080/` in a web browser

For guidance on building a packaged version, running tests, and contributing to
development, see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

iD is available under the [ISC License](https://opensource.org/licenses/ISC).
It includes [d3.js](http://d3js.org/), which BSD-licensed.

## Thank you

Initial development of iD was made possible by a [grant of the Knight Foundation](http://www.mapbox.com/blog/knight-invests-openstreetmap/).
