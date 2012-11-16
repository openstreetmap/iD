# iD - friendly JavaScript editor for OpenStreetMap

![](https://raw.github.com/systemed/iD/master/screenshot.jpg)

[Try the online demo of the most recent code.](http://geowiki.com/iD/)

## Basics

* iD is a JavaScript-based [OpenStreetMap](http://www.openstreetmap.org/) editor.
* It's intentionally simple. This is not a 90% editor -
  not even a 70% editor. It should let you do the most basic tasks while
  not breaking other people's data. Nothing more. (Same goes for the code,
  so go easy on the abstraction. :) )
* We're aiming to support modern desktop browsers and mobile browsers. The map
  rendering uses [SVG](http://en.wikipedia.org/wiki/Scalable_Vector_Graphics) via
  [d3](http://d3js.org/).

## Architecture

* iD uses [d3](http://d3js.org/) for graphics & managing databindings to the
  map. There's a tiny tiled-map core, but the majority of the action is in
  dynamic rendering of the editable map data.
* This project aims to create a usable object model of [OpenStreetMap data](http://wiki.openstreetmap.org/wiki/Tags)
  in Javascript that can be transformed by actions and serialized back into
  [changesets](http://wiki.openstreetmap.org/wiki/Changeset)

## Getting started

* Fork this project. We eagerly accept pull requests.
* See [open issues in the issue tracker if you're looking for something to do](https://github.com/systemed/iD/issues?state=open)
* All the code is in js/iD.

To run the code locally, just fork this project and run it from a local webserver.
With a Mac, you can enable Web Sharing and drop this in your website directory.

If you have Python handy, just `cd` into `iD` and run

     python -m SimpleHTTPServer

## How it works

The code inherits many elements from the [Potlatch 2](http://wiki.openstreetmap.org/wiki/Potlatch_2)
and [JOSM](http://josm.openstreetmap.de/) editors.

We store technical notes in [NOTES.md](https://github.com/systemed/iD/blob/master/NOTES.md). The
basic architecture is as follows:

* Map: vector rendering, panning behaviors & zoom/center state
* Tiles: receives map centers & draw tiles as a background for iD
* Connection: requests `/map` data from osm, parses this data and delivers it to the Graph
* Graph: stores a javascript object of `id -> osm object`
* History: stores multiple graphs which represent undo states

Relationships:

* Map has-a Tiles
* Map has-a Connection
* Map has-a History
* History has-many Graphs

## Coding tips

This project has a few basic guidelines for incoming code. The cardinal rules are:

1. Soft tabs only
2. Everything should pass [jshint](http://www.jshint.com/) without warning
3. Never write bugs

(you can write bugs). If you need a style guide, [AirBNB has a decent one.](https://github.com/airbnb/javascript)

Come on in, the water's lovely. More help? Ping RichardF or tmcw on IRC
(`irc.oftc.net`, in `#osm-dev` or `#osm`), on the OSM mailing lists or at
richard@systemeD.net.

## License

iD is available under the [WTFPL](http://sam.zoy.org/wtfpl/), though obviously, if you want to dual-license
any contributions that's cool. It includes [d3js](http://d3js.org/), which BSD-licensed.
