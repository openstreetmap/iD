d3.selection.prototype.dimensions = function (dimensions) {
    var refresh = (function(node) {
        var cr = node.getBoundingClientRect();
        prop = [cr.width, cr.height];
        this.property('__dimensions__', prop);
        return prop;
    }).bind(this);

    var node = this.node();

    if (!arguments.length) {
        if (!node) return [0,0];
        return this.property('__dimensions__') || refresh(node);
    }
    if (dimensions === null) {
        if (!node) return [0,0];
        return refresh(node);
    }

    return this
        .property('__dimensions__', [dimensions[0], dimensions[1]])
        .attr({width: dimensions[0], height: dimensions[1]});
};
