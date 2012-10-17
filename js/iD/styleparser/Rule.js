// iD/styleparser/Rule.js

define(['dojo/_base/declare','dojo/_base/array'], function(declare,array){

// ----------------------------------------------------------------------
// Rule class

declare("iD.styleparser.Rule", null, {

	conditions: [],		// the Conditions to be evaluated for the Rule to be fulfilled
	isAnd: true,		// do all Conditions need to be true for the Rule to be fulfilled? (Always =true for MapCSS)
	minZoom: 0,			// minimum zoom level at which the Rule is fulfilled
	maxZoom: 255,		// maximum zoom level at which the Rule is fulfilled
	subject: '',		// entity type to which the Rule applies: 'way', 'node', 'relation', 'area' (closed way) or 'line' (unclosed way)
	
	constructor:function(_subject) {
		// summary:		A MapCSS selector. Contains a list of Conditions; the entity type to which the selector applies; 
		//				and the zoom levels at which it is true. way[waterway=river][boat=yes] would be parsed into one Rule.
		//				The selectors and declaration together form a StyleChooser.
		this.subject=_subject;
		this.conditions=[];
	},
	
	addCondition:function(_condition) {
		// summary:		Add a condition to this rule.
		this.conditions.push(_condition);
	},

	test:function(entity,tags,zoom) {
		// summary:		Evaluate the Rule on the given entity, tags and zoom level.
		// returns: 	true if the Rule passes, false if the conditions aren't fulfilled.
		if ((this.subject !== '') && (entity.entityType !== this.subject)) {
            return false;
        }
		if (zoom<this.minZoom || zoom>this.maxZoom) { return false; }

		var v=true; var i=0; var isAnd=this.isAnd;
		array.forEach(this.conditions, function(condition) {
			var r=condition.test(tags);
			if (i === 0) { v=r; }
			else if (isAnd) { v=v && r; }
			else { v = v || r; }
			i++;
		});
		return v;
	},

	toString:function() {
		return this.subject+" z"+this.minZoom+"-"+this.maxZoom+": "+this.conditions;
	}
});

// ----------------------------------------------------------------------
// End of module
});
