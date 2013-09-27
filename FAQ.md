## Why not use canvas rather than SVG?

Using canvas rather than SVG would require implementing a scenegraph, hit-testing,
event dispatch, animation, and other features provided natively by SVG. All that is
a significant amount of work, would have meant a longer time for the initial release
of iD, and would likely increase the ongoing costs of maintenence and new features.

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

We've though a little about [caching tiles](https://github.com/systemed/iD/issues/127)
and downloaded data, but haven't actively worked on it, nor on the data download/upload
question.
