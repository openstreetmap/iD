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
        var proj = this.map.projection;

        var line = d3.svg.line()
            .x(function(d) { return proj([d.lon, d.lat])[0]; })
            .y(function(d) { return proj([d.lon, d.lat])[1]; })
            .interpolate("linear");

        if (!this.casing) {
            this.casing = this.map.layers[0].casing.append("path")
                .data([way.nodes])
                .attr('class', 'casing');
        }

        this.casing.attr("d", line);

        if (!this.stroke) {
            this.stroke = this.map.layers[0].stroke.append("path")
                .data([way.nodes])
                .attr('class', 'stroke');
        }

        this.stroke.attr("d", line);

        return this;
	},

	entityMouseEvent:function(event) {
		this.inherited(arguments);
	}
};
