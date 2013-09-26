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
