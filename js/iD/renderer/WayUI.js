// iD/renderer/WayUI.js
// WayUI classes for iD
// multipolygon support - http://mail.dojotoolkit.org/pipermail/dojo-interest/2011-January/052042.html
// support 'interactive'
// line decoration, dots etc.
// fill images
// opacity

define(['dojo/_base/declare','dojo/_base/lang','iD/renderer/EntityUI'], function(declare,lang){

// ----------------------------------------------------------------------
// WayUI class

declare("iD.renderer.WayUI", [iD.renderer.EntityUI], {
	constructor:function() {
		this.redraw();
	},
	getEnhancedTags:function() {
		var tags=this.inherited(arguments);
		if (this.entity.isClosed()) { tags[':area']='yes'; }
		return tags;
	},
	recalculate:function() {
		// ** FIXME: todo
	},
	redraw:function() {
		var way=this.entity;
		var maxwidth=4;
		var i;
		this.removeSprites();
		if (way.length()==0) { return; }

		// Create tags and calculate styleList
		var tags=this.getEnhancedTags();
		this.refreshStyleList(tags);

		// List of co-ordinates
		var coords=[];
		for (i=0; i<way.nodes.length; i++) {
			var node=way.nodes[i];
			coords.push( { x: this.map.lon2coord(node.lon), y: this.map.latp2coord(node.latp) } );
		}

		// Iterate through each subpart, drawing any styles on that layer
		var drawn=false;
		for (i=0; i<this.styleList.subparts.length; i++) {
			var subpart=this.styleList.subparts[i];
			if (this.styleList.shapeStyles[subpart]) {
				var s=this.styleList.shapeStyles[subpart];

				// Stroke
				if (s.width)  {
					this.recordSprite(this.targetGroup('stroke',s.sublayer).createPolyline(coords).setStroke(s.strokeStyler()));
					maxwidth=Math.max(maxwidth,s.width);
					drawn=true;
				}

				// Fill
				if (!isNaN(s.fill_color)) {
					this.recordSprite(this.targetGroup('fill',s.sublayer).createPolyline(coords).setFill(s.fillStyler()));
					drawn=true;
				}

				// Casing
				if (s.casing_width) { 
					this.recordSprite(this.targetGroup('casing').createPolyline(coords).setStroke(s.casingStyler()));
					maxwidth=Math.max(maxwidth,s.width+s.casing_width*2);
					drawn=true;
				}
			}
			
			// Text label on path
			if (this.styleList.textStyles[subpart]) {
				var t=this.styleList.textStyles[subpart];
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
			var hit=this.recordSprite(this.targetGroup('hit').createPolyline(coords).setStroke( { width:maxwidth+8, color: [0,0,0,0] } ));
			hit.source=this;
			hit.connect("onclick"     , lang.hitch(this,this.entityMouseEvent));
			hit.connect("onmousedown" , lang.hitch(this,this.entityMouseEvent));
			hit.connect("onmouseup"   , lang.hitch(this,this.entityMouseEvent));
			hit.connect("onmouseenter", lang.hitch(this,this.entityMouseEvent));
			hit.connect("onmouseleave", lang.hitch(this,this.entityMouseEvent));
		}
		// Draw nodes
		for (i=0; i<way.length(); i++) {
			var node=way.nodes[i];
			var sc=[];
			if (tags[':shownodes']) { sc.push('selectedway'); }
			if (tags[':shownodeshover']) { sc.push('hoverway'); }
			if (node.parentWays().length>1) { sc.push('junction'); }
			this.map.createUI(node,sc);
		}
	},
	
	entityMouseEvent:function(event) {
		this.inherited(arguments);
	},
});

// ----------------------------------------------------------------------
// End of module
});
