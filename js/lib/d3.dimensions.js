d3.selection.prototype.dimensions = function (dimensions) {
    if (!arguments.length) {
        var node = this.node();
        if (!node) return;

        var prop = this.property('__dimensions__');
        if (!prop) {
            var cr = node.getBoundingClientRect();
            prop = [cr.width, cr.height];
            this.property('__dimensions__', prop);
        }
        return prop;
    }

    this.property('__dimensions__', [dimensions[0], dimensions[1]]);
    return this.attr({width: dimensions[0], height: dimensions[1]});
};
