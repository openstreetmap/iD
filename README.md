# iD - friendly JavaScript editor for [OpenStreetMap](http://www.openstreetmap.org/)

[![Build Status](https://travis-ci.org/openstreetmap/iD.svg?branch=master)](https://travis-ci.org/openstreetmap/iD)
[![Greenkeeper badge](https://badges.greenkeeper.io/openstreetmap/iD.svg)](https://greenkeeper.io/)

## Basics

* iD is a JavaScript [OpenStreetMap](http://www.openstreetmap.org/) editor.
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
* [OpenStreetMap IRC](http://wiki.openstreetmap.org/wiki/IRC)
(`irc.oftc.net`, in `#iD` or `#osm-dev` or `#osm`)
* [OpenStreetMap `dev` mailing list](http://wiki.openstreetmap.org/wiki/Mailing_lists)

## GeoService import branch

In this branch, we are developing a tool to import authoritative data from a GeoService (such as the open data
on ArcGIS.com) into iD and OpenStreetMap.

### Sample GeoServices

* <a href='https://maps.cityofmadison.com/arcgis/rest/services/Public/OPEN_DATA_TRANS/MapServer/18/query?outFields=*&where=1>0&outSR=4326&f=json'>Madison, WI - bus lines</a>
* <a href='http://orfmaps.norfolk.gov/orfgis/rest/services/OpenData/Property_Information/MapServer/0/query?outFields=*&where=1%3D1&outSR=4326&f=json'>Norfolk, VA - addresses</a>
* <a href='http://orfmaps.norfolk.gov/orfgis/rest/services/OpenData/Property_Information/MapServer/2/query?outFields=*&where=1%3D1&outSR=4326&f=json'>Norfolk, VA - parcels</a>
* <a href='http://gis1.hartford.gov/arcgis/rest/services/OpenData_Community/MapServer/41/query?outFields=*&where=1%3D1'>Hartford, CT - complex buildings / OSM relations</a>
* <a href='https://webdmz.starkcountyohio.gov/arcgis/rest/services/RPC/RideStarkOnRoadBikeLane/MapServer/0/query?outFields=*&where=1%3D1'>Stark County / Canton, OH - bike lanes</a>

### Editing Process

In the right menubar, select Map Data (as if you are importing a GPX layer)

Click on 'Import GeoService'

Use the iD editor's preset menu on the left to set a target import (for example, a building or address).

Paste the GeoService URL into the text field (it is also possible to add a service to iD automatically by including &geoservice=(escaped URL) in a link URL).

Select to Download Viewport (for large datasets) or Download All data into the browser.

Depending on your settings you can either approve individual additions to OSM, or include all data by default.

The GeoService importer now gives you the option to map the service's fields to OSM tags.

* You can change the name of the tag in your GeoService 
* You can add new fields - for example, addresses in Norfolk, Virginia should have ```addr:city=Norfolk``` and ```addr:state=VA``` which are ignored as redundant in the city's data
* Fields which you do not map are removed from the data before import

## Prerequisites

* [Node.js](https://nodejs.org/) version 4 or newer
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

1. Create a local `git clone` of the project, then `cd` into the project folder
2. Run `npm install`  (this will run the `prepublish` script that builds everything)
3. Run `npm start`
4. Open `http://localhost:8080/` in a web browser

For guidance on building a packaged version, running tests, and contributing to
development, see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

iD is available under the [ISC License](https://opensource.org/licenses/ISC).
See the [LICENSE.md](LICENSE.md) file for more details.

## Thank you

Initial development of iD was made possible by a [grant of the Knight Foundation](https://www.mapbox.com/blog/knight-invests-openstreetmap/).
