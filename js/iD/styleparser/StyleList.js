// iD/styleparser/StyleList.js

define(['dojo/_base/declare'], function(declare){

// ----------------------------------------------------------------------
// StyleList class


declare("iD.styleparser.StyleList", null, {

	shapeStyles: {},
	textStyles: {},
	pointStyles: {},
	shieldStyles: {},
	maxwidth: 0,
	subparts: [],			// List of subparts used in this StyleList
	validAt: -1,				// Zoom level this is valid at (or -1 at all levels - saves recomputing)

	constructor:function() {
		// summary: A StyleList object is the full list of all styles applied to
		// a drawn entity (i.e. node/way). Each array element applies to that 
		// sublayer (z-index). If there is no element, nothing is drawn on that sublayer.
		// StyleLists are created by StyleChooser.getStyles.
		this.shapeStyles = {};
		this.textStyles = {};
		this.pointStyles = {};
		this.shieldStyles = {};
		this.subparts = [];
	},

	hasStyles:function() {
		// summary:		Does this StyleList contain any styles?
		return (this.hasShapeStyles() || this.hasTextStyles() || this.hasPointStyles() || this.hasShieldStyles());
	},

	hasFills:function() {
		// summary:		Does this StyleList contain any styles with a fill?
		for (var s in this.shapeStyles) {
			if (!isNaN(this.shapeStyles(s).fill_color) || this.shapeStyles(s).fill_image) return true;
		}
		return false;
	},

	layerOverride:function() {
		// summary:		If this StyleList manually forces an OSM layer, return it, otherwise null.
		for (var s in this.shapeStyles) {
			if (!isNaN(this.shapeStyles[s].layer)) return this.shapeStyles[s].layer;
		}
		return NaN;
	},

	addSubpart:function(s) {
		// summary:		Record that a subpart is used in this StyleList. 
		if (this.subparts.indexOf(s)==-1) { this.subparts.push(s); }
	},

	isValidAt:function(zoom) {
		// summary:		Is this StyleList valid at a given zoom? 
		return (this.validAt==-1 || this.validAt==zoom);
	},

	toString:function() {
		// summary:		Summarise StyleList as String - for debugging
		var str = '';
		var k;
		for (k in this.shapeStyles ) { str+="- SS "+k+"="+this.shapeStyles[k]+"\n"; }
		for (k in this.textStyles  ) { str+="- TS "+k+"="+this.textStyles[k]+"\n"; }
		for (k in this.pointStyles ) { str+="- PS "+k+"="+this.pointStyles[k]+"\n"; }
		for (k in this.shieldStyles) { str+="- sS "+k+"="+this.shieldStyles[k]+"\n"; }
		return str;
	},

	hasShapeStyles:function()  { for (var a in shapeStyles ) { return true; } return false; },
	hasTextStyles:function()   { for (var a in textStyles  ) { return true; } return false; },
	hasPointStyles:function()  { for (var a in pointStyles ) { return true; } return false; },
	hasShieldStyles:function() { for (var a in shieldStyles) { return true; } return false; }
});

// ----------------------------------------------------------------------
// End of module
});
