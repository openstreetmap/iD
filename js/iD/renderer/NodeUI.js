// iD/renderer/NodeUI.js
// NodeUI classes for iD

define(['dojo/_base/declare','dojo/_base/lang','dojo/_base/array','dojox/gfx/_base','iD/renderer/EntityUI'], 
       function(declare,lang,array,g){

// ----------------------------------------------------------------------
// NodeUI class

declare("iD.renderer.NodeUI", [iD.renderer.EntityUI], {
	constructor:function() {
		// summary:		A UI (rendering) representing a node.
		this.redraw();
	},
	getEnhancedTags:function() {
		var tags=this.inherited(arguments);
		if (!this.entity.entity.hasParentWays()) { tags[':poi']='yes'; }
		// add junction and dupe
		return tags;
	},
	redraw:function() {
		// summary:		Draw the object (mostly icons) and add hitzone sprites.
		var node = this.entity;
		this.removeSprites();

		// Tags, position and styleList
		var x = Math.floor(this.map.lon2coord(this.entity.lon));
		var y = Math.floor(this.map.latp2coord(this.entity.latp));
		var tags = this.getEnhancedTags();
		this.refreshStyleList(tags);

		// Iterate through each subpart, drawing any styles on that layer
		var drawn=false;
		var s,p,t,w,h;
		for (i = 0; i < this.styleList.subparts.length; i++) {
			var subpart=this.styleList.subparts[i];
			p = this.styleList.pointStyles[subpart];
			if (!p || !p.drawn()) { continue; }
			s = this.styleList.shapeStyles[subpart];
			t = this.styleList.textStyles[subpart];
			w = p.icon_width ? p.icon_width : 16;
			h = p.icon_height ? p.icon_height: w;

			// Draw icon
			var shape;
			switch (p.icon_image) {
				case 'square':shape=this.targetGroup('stroke',p.sublayer).createRect({ x:x-w/2, y:y-h/2, width:w, height:h }); break;
				case 'circle':shape=this.targetGroup('stroke',p.sublayer).createCircle({ cx:x, cy:y, r:w }); break;
				default:shape=this.targetGroup('stroke',p.sublayer).createImage({ width:w, height:h, x: x-w/2, y: y-h/2, src:p.icon_image }); break;
			}
			switch (p.icon_image) {
				case 'square':
				case 'circle': 	shape.setStroke(s.shapeStrokeStyler()).setFill(s.shapeFillStyler()); break;
			}
			this.recordSprite(shape);

			// Add text label
			// Add hit-zone
			var hit;
			switch (p.icon_image) {
				case 'circle': 	hit=this.targetGroup('hit').createCircle({ cx:x, cy:y, r:w }); break;
				default: 		hit=this.targetGroup('hit').createRect({ x:x-w/2, y:y-h/2, width:w, height: h}); break;
			}
			hit.setFill([0,1,0,0]).setStroke( { width:2, color:[0,0,0,0] } );
			this.recordSprite(hit);
			hit.source=this;
			hit.connect("onclick"     , lang.hitch(this,this.entityMouseEvent));
			hit.connect("onmousedown" , lang.hitch(this,this.entityMouseEvent));
			hit.connect("onmouseup"   , lang.hitch(this,this.entityMouseEvent));
			hit.connect("onmouseenter", lang.hitch(this,this.entityMouseEvent));
			hit.connect("onmouseleave", lang.hitch(this,this.entityMouseEvent));
		}
	}
	
});


// ----------------------------------------------------------------------
// End of module
});
