iD - JavaScript beginners' editor for OpenStreetMap
===================================================

Basics
------
* iD is a JavaScript-based OpenStreetMap editor with MapCSS rendering.
* iD is written with the Dojo framework.
* It's intentionally simple. iD is not a 90% editor. It's not even a 70% editor. It should let you do the most basic tasks while not breaking other people's data. Nothing more. 
* Same goes for the code. So go easy on the abstraction. :)
* Speaking of percentages, it's about 1% complete.
* We're initially targeting WebKit-based browsers and Firefox, using SVG. IE and non-SVG can come later!
* The licence of iD is WTFPL and contributions to 'trunk' should accord with this. This does of course allow you to dual-license.


Getting started
---------------
* Unzip and start playing!
* All the code is in js/iD. 


How it works
------------
The code works similarly to Potlatch 2, but with a bit less abstraction. So, we have:

* Connection: stores, fetches and saves data. (iD/Connection.js)
* Entity (Node, Way, Relation): the data objects. (iD/Entity.js)
* EntityUI (NodeUI, WayUI): the rendered graphic elements. (iD/renderer/...)
* Map: the displayed map on which EntityUIs are rendered. (iD/renderer/Map.js)
* Controller: the heart of the app, which does its work via...
* ControllerState: the current UI mode. ControllerStates decide what to do in response to mouse/keyboard events. (iD/controller/...)
* UndoableAction: the code to actually change the data, as fired by ControllerStates. (iD/actions/...)

The UI is more modal than Potlatch 2. In particular there's a "draw shape" mode (the "Add road or shape" button) and an "edit object" mode. The directory structure of iD/controller reflects this.

Other relevant code includes the MapCSS parser in styleparser/ and custom widgets in ui/ .


Getting started
---------------
Most of the interesting code is in the ControllerStates, which live in iD/controller/. Each one corresponds to a UI mode (e.g. "drawing a way"). Its EntityMouseEvent method takes the user's mouse event (e.g. "clicked on a node"), carries out any actions, and returns the new ControllerState (which might just be 'this', i.e. carry on with the current state).


Coding tips
-----------
Scoping in JavaScript is famously broken: Dojo's lang.hitch method will save your life. Make sure you include dojo/_base/lang (in the 'declare' statement). Then, when you're passing an instance method as a function parameter, use lang.hitch(instance, instance.method) instead, and Dojo will magically set the right scope. You'll see lots of examples of this throughout the code.

Instance methods and variables _always_ need to be accessed with 'this.'. This is a fairly frequent gotcha if you're coming from another language.

You'll find various notes and comments in the docs/ folder. Feel free to add to these.

More help: ping RichardF on IRC (irc.oftc.net, in #osm-dev or #osm), on the OSM mailing lists or at richard@systemeD.net.
