## How is "iD" pronounced?

Two syllables: "eye dee".


## How can I help translate iD into another language or fix a mistranslation?

Please see [CONTRIBUTING.md](https://github.com/openstreetmap/iD/blob/develop/CONTRIBUTING.md#translating)


## How can I report an issue with background imagery?

To report an issue with missing or cloudy imagery:
* _For Mapbox Satellite layer:_ Zoom into the location in [this imagery feedback tool](https://apps.mapbox.com/feedback/satellite/) and describe the problem.
* _For Bing Satellite layer:_ Open the location in [Bing Maps](https://www.bing.com/maps), click the "Feedback" button and choose "Report a map problem" option.
* _For Esri World Imagery:_ You can open a new issue using the [Imagery Map Feedback tool](https://www.arcgis.com/home/item.html?id=ebdfa4146680410bb952c7d532ea5407).

iD's list of available background imagery sources come from the [editor-layer-index](https://github.com/osmlab/editor-layer-index)
project.  If you know of a more recent imagery source that is licensed for this use,
please open a request there with the link and license details.


## I'm having trouble seeing some of the colors. Is there a way to customize or change them?

Because iD uses CSS and SVG for all its rendering, users can override the colors
with the [Stylish extension](https://en.wikipedia.org/wiki/Stylish) on Firefox or Chrome.
Stylish also allows users to share custom styles with others.

You can find detailed instructions on how to install Stylish
[here on learnosm.org](http://learnosm.org/en/hot-tips/enhance/).

See also: https://github.com/openstreetmap/iD/issues/3095#issuecomment-224988925


## Why not use canvas rather than SVG?

Using canvas rather than SVG would require implementing a scenegraph, hit-testing,
event dispatch, animation, and other features provided natively by SVG. All that is
a significant amount of work, would have meant a longer time for the initial release
of iD, and would likely increase the ongoing costs of maintenance and new features.

On the other hand, SVG is already fast enough in many or most hardware/browser/OS/editing
region combinations, and will only get faster as hardware improves and browser vendors
optimize their implementations and take better advantage of hardware acceleration.

In other words, the decision to use SVG rather than canvas was a classic performance
vs. implementation cost tradeoff with strong arguments for trading off performance to
reduce implementation costs.


## Can I use iD offline?

iD does not currently have an offline mode.

To support offline usage requires caching or providing an offline proxy for the three
main things iD uses the network for:

* Downloading existing data -- this is done on demand as you pan around
* Downloading tiles -- ditto
* Uploading changes

We've thought a little about [caching tiles](https://github.com/openstreetmap/iD/issues/127)
and downloaded data, but haven't actively worked on it, nor on the data download/upload
question.


## Can I use iD with my own OSM server?

Yes, you can. You will need to [install](https://github.com/openstreetmap/openstreetmap-website/blob/master/INSTALL.md)
and [configure](https://github.com/openstreetmap/openstreetmap-website/blob/master/CONFIGURE.md)
an instance of the Rails Port, the server that runs the OpenStreetMap website and API.

Once you have the Rails Port running, you may edit as normal using the version of iD that
is bundled with it. Your changes will be saved to your own database. To use a standalone iD with your own api, you may edit the [osm.js](https://github.com/openstreetmap/iD/blob/develop/modules/services/osm.js) file.

Depending on your requirements, you may also want to set up [cgimap](https://github.com/openstreetmap/cgimap)
and/or a tile rendering stack, but neither of these are required for editing with iD.
