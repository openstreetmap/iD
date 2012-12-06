d3.latedrag = function() {
    var filter = d3.functor(true);

    function latedrag(selection) {
        var mousedown = selection.on('mousedown.drag');
        selection.on('mousedown.drag', null);
        selection.on('mousedown.latedrag', function() {
            var datum = d3.select(d3.event.target).datum();
            if (datum && filter(datum)) {
                mousedown.apply(d3.event.target, [datum]);
            }
        });
    }

    latedrag.filter = function(_) {
        if (!arguments.length) return filter;
        filter = _;
        return latedrag;
    };

    return latedrag;
};
