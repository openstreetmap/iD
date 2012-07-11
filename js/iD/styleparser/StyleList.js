// iD/styleparser/StyleList.js

define(['dojo/_base/declare'], function(declare){

// ----------------------------------------------------------------------
// StyleList class
// Not tested yet!

// A StyleList object is the full list of all styles applied to
// a drawn entity (i.e. node/way).
// Each array element applies to that sublayer (z-index). If there
// is no element, nothing is drawn on that sublayer.
// StyleLists are created by StyleChooser.getStyles.

declare("iD.styleparser.StyleList", null, {

	shapeStyles:{},
	textStyles:{},
	pointStyles:{},
	shieldStyles:{},
	maxwidth:0,
	subparts:[],			// List of subparts used in this StyleList
	validAt:-1,				// Zoom level this is valid at (or -1 at all levels - saves recomputing)
	
	constructor:function() {
		this.shapeStyles={};
		this.textStyles={};
		this.pointStyles={};
		this.shieldStyles={};
		this.subparts=[];
	},
	
	// Does this StyleList contain any styles?
	hasStyles:function() {
		return ( this.hasShapeStyles() || this.hasTextStyles() || this.hasPointStyles() || this.hasShieldStyles() );
	},
	
	// Does this StyleList contain any styles with a fill?
	hasFills:function() {
		for (var s in this.shapeStyles) {
			if (!isNaN(this.shapeStyles(s).fill_color) || this.shapeStyles(s).fill_image) return true;
		}
		return false;
	},

	// Does this StyleList manually force an OSM layer? 
	layerOverride:function() {
		for (var s in this.shapeStyles) {
			if (!isNaN(this.shapeStyles[s].layer)) return this.shapeStyles[s].layer;
		}
		return NaN;
	},

	// Record that a subpart is used in this StyleList. 
	addSubpart:function(s) {
		if (this.subparts.indexOf(s)==-1) { this.subparts.push(s); }
	},

	// Is this StyleList valid at a given zoom? 
	isValidAt:function(zoom) {
		return (this.validAt==-1 || this.validAt==zoom);
	},

	// Summarise StyleList as String - for debugging
	toString:function() {
		var str='';
		var k;
		for (k in this.shapeStyles ) { str+="- SS "+k+"="+this.shapeStyles[k]+"\n"; }
		for (k in this.textStyles  ) { str+="- TS "+k+"="+this.textStyles[k]+"\n"; }
		for (k in this.pointStyles ) { str+="- PS "+k+"="+this.pointStyles[k]+"\n"; }
		for (k in this.shieldStyles) { str+="- sS "+k+"="+this.shieldStyles[k]+"\n"; }
		return str;
	},

	hasShapeStyles:function()  { for (var a in shapeStyles ) { return true; }; return false; },
	hasTextStyles:function()   { for (var a in textStyles  ) { return true; }; return false; },
	hasPointStyles:function()  { for (var a in pointStyles ) { return true; }; return false; },
	hasShieldStyles:function() { for (var a in shieldStyles) { return true; }; return false; },

});

// ----------------------------------------------------------------------
// End of module
});
