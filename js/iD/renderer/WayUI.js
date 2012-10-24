// WayUI classes for iD
// **** TODO:
// multipolygon support - http://mail.dojotoolkit.org/pipermail/dojo-interest/2011-January/052042.html
// support 'interactive'
// line decoration, dots etc.
// fill images
// opacity

// ----------------------------------------------------------------------
// WayUI class
iD.renderer.WayUI = function(entity, map) {
    this.entity = entity;
    this.map = map;
    this.draw();
};

iD.renderer.WayUI.prototype = {
	getEnhancedTags: function() {
		var tags = this.entity.tags;
		if (this.entity.isClosed()) { tags[':area']='yes'; }
		return tags;
	},
	draw: function() {
		// summary:		Draw the object and add hitzone sprites.
		var way = this.entity,
            maxwidth = 4,
            i;

		if (!way.nodes.length) { return; }

		// Create tags and calculate styleList
		var tags = this.getEnhancedTags();

		// List of co-ordinates
		var coords = _.map(way.nodes, _.bind(function(node) {
            return {
                x: this.map.lon2coord(node.lon),
                y: this.map.latp2coord(node.latp)
            };
        }, this));

        var line = d3.svg.line()
            .x(function(d) { return d.x; })
            .y(function(d) { return d.y; })
            .interpolate("linear");

        this.map.layers[0].casing.append("path")
            .data([coords])
            .attr('class', 'casing')
            .attr("d", line);

        this.map.layers[0].stroke.append("path")
            .data([coords])
            .attr('class', 'stroke')
            .attr("d", line);

        return this;
	},

	entityMouseEvent:function(event) {
		this.inherited(arguments);
	}
};
