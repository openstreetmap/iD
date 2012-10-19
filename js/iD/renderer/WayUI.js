// iD/renderer/WayUI.js
// WayUI classes for iD
// **** TODO:
// multipolygon support - http://mail.dojotoolkit.org/pipermail/dojo-interest/2011-January/052042.html
// support 'interactive'
// line decoration, dots etc.
// fill images
// opacity

define(['dojo/_base/declare','iD/renderer/EntityUI'], function(declare) {

// ----------------------------------------------------------------------
// WayUI class

declare("iD.renderer.WayUI", [iD.renderer.EntityUI], {
	constructor: function() {
		// summary:		A UI (rendering) representing a way.
		this.redraw();
	},
	getEnhancedTags: function() {
		var tags=this.inherited(arguments);
		if (this.entity.isClosed()) { tags[':area']='yes'; }
		return tags;
	},
	recalculate: function() {
		// summary:		Not yet implemented - calculate length/centrepoint of UI for use in rendering.
		// ** FIXME: todo
	},
	redraw: function() {
		// summary:		Draw the object and add hitzone sprites.
		var way = this.entity,
            maxwidth=4,
            i;

		this.removeSprites();
		if (!way.nodes.length) { return; }

		// Create tags and calculate styleList
		var tags = this.getEnhancedTags();
		this.refreshStyleList(tags);

		// List of co-ordinates
		var coords = _.map(way.nodes, _.bind(function(node) {
            return this.map.locationPoint(node);
        }, this));

		// Iterate through each subpart, drawing any styles on that layer
		var drawn = false;
		for (i = 0; i < this.styleList.subparts.length; i++) {
			var subpart = this.styleList.subparts[i];
			if (this.styleList.shapeStyles[subpart]) {
				var s = this.styleList.shapeStyles[subpart], line;

				// Stroke
				if (s.width)  {
                    line = this.targetGroup('stroke',s.sublayer)
                        .createPolyline(coords)
                        .setStroke(s.strokeStyler());

					this.recordSprite(line);
					maxwidth = Math.max(maxwidth, s.width);
					drawn = true;
				}

				// Fill
				if (!isNaN(s.fill_color)) {
                    line = this.targetGroup('fill',s.sublayer)
                        .createPolyline(coords)
                        .setFill(s.fillStyler());

					this.recordSprite(line);
					drawn = true;
				}

				// Casing
				if (s.casing_width) {
                    line = this.targetGroup('casing')
                        .createPolyline(coords)
                        .setStroke(s.casingStyler());

					this.recordSprite(line);
					maxwidth = Math.max(maxwidth, s.width + s.casing_width * 2);
					drawn = true;
				}
			}

			// Text label on path
			if (this.styleList.textStyles[subpart]) {
				var t = this.styleList.textStyles[subpart];
				if (t.text && tags[t.text]) {
					var tp=this.recordSprite(this.targetGroup('text')
						.createTextPath(t.textStyler(tags[t.text]))
						.setFont(t.fontStyler())
						.setFill(t.fillStyler())
						.moveTo(coords[0].x,coords[0].y));
					for (var j=1; j<coords.length; j++) {
						tp.lineTo(coords[j].x,coords[j].y);
					}
					// *** this next line is SVG-specific
					tp.rawNode.setAttribute("pointer-events","none");
				}
			}

		}

		// Add hitzone sprite
		if (drawn) {
			var hit=this.recordSprite(this.targetGroup('hit')
                .createPolyline(coords)
                .setStroke({
                    width: maxwidth+8,
                    color: [0,0,0,0]
                }));

            var entityMouseEvent = _.bind(this.entityMouseEvent, this);
			hit.source=this;
			hit.connect("onclick", entityMouseEvent);
			hit.connect("onmousedown", entityMouseEvent);
			hit.connect("onmouseup", entityMouseEvent);
			hit.connect("onmouseenter", entityMouseEvent);
			hit.connect("onmouseleave", entityMouseEvent);
		}
		// Draw nodes
        _.each(way.nodes, _.bind(function(node) {
			var sc = [];
			if (tags[':shownodes']) { sc.push('selectedway'); }
			if (tags[':shownodeshover']) { sc.push('hoverway'); }
			if (node.entity.parentWays().length>1) { sc.push('junction'); }
			this.map.createUI(node, sc);
		}, this));

        return this;
	},

	entityMouseEvent:function(event) {
		this.inherited(arguments);
	}
});

// ----------------------------------------------------------------------
// End of module
});
