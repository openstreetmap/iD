# iD - friendly JavaScript editor for [OpenStreetMap](http://www.openstreetmap.org/)

[![Build Status](https://secure.travis-ci.org/openstreetmap/iD.png)](https://travis-ci.org/openstreetmap/iD)

## Basics

* iD is a JavaScript [OpenStreetMap](http://www.openstreetmap.org/) editor.
* It's intentionally simple. It lets you do the most basic tasks while
  not breaking other people's data.
* It supports modern browsers. Data is rendered with [d3](http://d3js.org/).

## Participate!

* [Try out the latest stable release](http://openstreetmap.us/iD/release)
* [Read up on Contributing and the code style of iD](CONTRIBUTING.md)
* See [open issues in the issue tracker](https://github.com/openstreetmap/iD/issues?state=open) if you're looking for something to do
* [Translate!](https://github.com/openstreetmap/iD/blob/master/CONTRIBUTING.md#translating)

[![translation chart](https://www.transifex.com/projects/p/id-editor/chart/image_png)](https://github.com/openstreetmap/iD/blob/master/CONTRIBUTING.md#translating)

## Prerequisites

* [Node.js](http://nodejs.org/) version 0.10.0 or newer
* Command line development tools (`make`, `git`, and a compiler) for your platform
  * Ubuntu: `sudo apt-get install build-essential git`
  * Mac OS X: Install Xcode and run `xcode-select --install` from a command line

## Installation

To run the current development version of iD on your own computer:

1. Create a local `git clone` of the project, then `cd` into the project folder
2. Run `npm install`
3. Run `make`
4. Start a local web server, e.g. `python -m SimpleHTTPServer`
5. Open `http://localhost:8000/` in a web browser

Come on in, the water's lovely. More help? Ping tmcw, jfire, or bhousel on IRC
(`irc.oftc.net`, in `#iD` or `#osm-dev` or `#osm`) or on the OSM mailing lists.

For guidance on building a packaged version, running tests, and contributing to
development, see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

iD is available under the [ISC License](https://opensource.org/licenses/ISC).
It includes [d3js](http://d3js.org/), which BSD-licensed.

## Thank you

Initial development of iD was made possible by a [grant of the Knight Foundation](http://www.mapbox.com/blog/knight-invests-openstreetmap/).
