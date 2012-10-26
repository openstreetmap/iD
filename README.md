iD - friendly JavaScript editor for OpenStreetMap
=================================================

Basics
------
* iD is a JavaScript-based [OpenStreetMap](http://www.openstreetmap.us/) editor.
* It's intentionally simple. This is not a 90% editor -
  not even a 70% editor. It should let you do the most basic tasks while
  not breaking other people's data. Nothing more. (Same goes for the code,
  so go easy on the abstraction. :) )
* Speaking of percentages, it's about 1% complete.
* The licence of iD is [WTFPL](http://sam.zoy.org/wtfpl/), though obviously, if you want to dual-license
  any contributions that's cool.

Architecture
------------

* iD uses [d3js](http://d3js.org/) for graphics & managing databindings to the
  map. There's a tiny tiled-map core, but the majority of the action is in
  dynamic rendering of the editable map data.
* This project aims to create a usable object model of [OpenStreetMap data](http://wiki.openstreetmap.org/wiki/Tags)
  in Javascript that can be transformed by actions and serialized back into
  [changesets](http://wiki.openstreetmap.org/wiki/Changeset)

Getting started
---------------
* Fork it and start playing!
* Read the [live docs](http://www.geowiki.com/docs/), generated from source every hour.
* All the code is in js/iD.


How it works
------------
The code works similarly to [Potlatch 2](http://wiki.openstreetmap.org/wiki/Potlatch_2),
but with a bit less abstraction. So, we have:

* Connection: stores, fetches and saves data. (iD/Connection.js)
* Entity (Node, Way, Relation): the data objects. (iD/Entity.js)
* EntityUI (NodeUI, WayUI): the rendered graphic elements. (iD/renderer/...)
* Map: the displayed map on which EntityUIs are rendered. (iD/renderer/Map.js)
* Controller: the heart of the app, which does its work via...
* ControllerState: the current UI mode. ControllerStates decide what to do in
  response to mouse/keyboard events. (iD/controller/...)
* UndoableAction: the code to actually change the data, as fired by
  ControllerStates. (iD/actions/...)

The UI is much more modal than Potlatch 2. In particular there's a "draw shape"
mode (the "Add road or shape" button) and an "edit object" mode. The directory
structure of iD/controller reflects this.

As well as the [live docs](http://www.geowiki.com/docs/), you'll find
various notes and comments in the docs/ folder. Feel free to add to these.


Getting started
---------------
Most of the interesting code is in the ControllerStates, which live in
iD/controller/. Each one corresponds to a UI mode (e.g. "drawing a way").
Its EntityMouseEvent method takes the user's mouse event (e.g. "clicked on
a node"), carries out any actions, and returns the new ControllerState
(which might just be 'this', i.e. carry on with the current state).


Coding tips
-----------

Come on in, the water's lovely. More help? Ping RichardF on IRC
(irc.oftc.net, in #osm-dev or #osm), on the OSM mailing lists or at
richard@systemeD.net.
