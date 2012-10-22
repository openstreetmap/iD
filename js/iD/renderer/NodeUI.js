// iD/renderer/NodeUI.js
// NodeUI classes for iD

define(['dojo/_base/declare','dojox/gfx/_base','iD/renderer/EntityUI'],
       function(declare,g){

// ----------------------------------------------------------------------
// NodeUI class

declare("iD.renderer.NodeUI", [iD.renderer.EntityUI], {
	constructor: function() {
		// summary:		A UI (rendering) representing a node.
		this.redraw();
	},
	getEnhancedTags: function() {
		var tags = this.inherited(arguments);
		if (!this.entity.entity.hasParentWays()) { tags[':poi']='yes'; }
		// add junction and dupe
		return tags;
	},
	redraw: function() {
		// summary:		Draw the object (mostly icons) and add hitzone sprites.
		var node = this.entity;
		this.removeSprites();

		// Tags, position and styleList
        var px = this.map.locationPoint(node),
            x = px.x,
            y = px.y;

		var tags = this.getEnhancedTags();
		this.refreshStyleList(tags);

		// Iterate through each subpart, drawing any styles on that layer
		var drawn = false;
		var s, p, t, w, h;
		for (i = 0; i < this.styleList.subparts.length; i++) {
			var subpart = this.styleList.subparts[i];
			p = this.styleList.pointStyles[subpart];
			if (!p || !p.drawn()) { continue; }
			s = this.styleList.shapeStyles[subpart];
			t = this.styleList.textStyles[subpart];
			w = p.icon_width ? p.icon_width : 16;
			h = p.icon_height ? p.icon_height: w;

            // Draw icon
            var shape;
            if (p.icon_image ===  'square') {
                shape = this.targetGroup('stroke', p.sublayer)
                    .createRect({
                        x: x-w/2,
                        y: y-h/2,
                        width: w,
                        height: h
                    });
            } else if (p.icon_image ===  'circle') {
                shape = this.targetGroup('stroke', p.sublayer)
                    .createCircle({
                        cx: x,
                        cy: y,
                        r: w
                    });
            } else {
                shape = this.targetGroup('stroke',p.sublayer)
                    .createImage({
                        width: w,
                        height: h,
                        x: x-w/2,
                        y: y-h/2,
                        src: p.icon_image
                    });
            }
            if (p.icon_image === 'square' || p.icon_image === 'circle') {
				shape.setStroke(s.shapeStrokeStyler()).setFill(s.shapeFillStyler());
			}
			this.recordSprite(shape);

			// Add text label
			// Add hit-zone
			var hit;
            if (p.icon_image === 'circle') {
                hit = this.targetGroup('hit').createCircle({
                    cx: x,
                    cy: y,
                    r: w
                });
            } else {
                hit = this.targetGroup('hit').createRect({
                    x: x-w/2,
                    y: y-h/2,
                    width: w,
                    height: h
                });
            }
            hit.setFill([0,1,0,0]).setStroke({
                width:2,
                color:[0,0,0,0]
            });
			this.recordSprite(hit);
			hit.source = this;
			hit.connect("onclick", _.bind(this.entityMouseEvent, this));
			hit.connect("onmousedown", _.bind(this.entityMouseEvent, this));
			hit.connect("onmouseup", _.bind(this.entityMouseEvent, this));
			hit.connect("onmouseenter", _.bind(this.entityMouseEvent, this));
			hit.connect("onmouseleave", _.bind(this.entityMouseEvent, this));
		}

        return this;
	}
});


// ----------------------------------------------------------------------
// End of module
});
