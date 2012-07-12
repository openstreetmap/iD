// iD/styleparser/RuleChain.js

define(['dojo/_base/declare','iD/styleparser/Rule'], function(declare){

// ----------------------------------------------------------------------
// RuleChain base class
// In contrast to Halcyon, note that length() is a function, not a getter property

/**	A descendant list of MapCSS selectors (Rules).

	For example,
		relation[type=route] way[highway=primary]
		^^^^^^^^^^^^^^^^^^^^ ^^^^^^^^^^^^^^^^^^^^
		    first Rule           second Rule
		       |------------|---------|
		                    |
		             one RuleChain

*/

declare("iD.styleparser.RuleChain", null, {

	rules:[],				// list of Rules
	subpart: 'default',		// subpart name, as in way[highway=primary]::centreline
	
	constructor:function() {
		// summary:		A descendant list of MapCSS selectors (Rules).
		this.rules=[];
	},

	// Functions to define the RuleChain

	addRule:function(_subject) {
		this.rules.push(new iD.styleparser.Rule(_subject));
	},

	addConditionToLast:function(_condition) {
		this.rules[this.rules.length-1].addCondition(_condition);
	},

	addZoomToLast:function(z1,z2) {
		this.rules[this.rules.length-1].minZoom=z1;
		this.rules[this.rules.length-1].maxZoom=z2;
	},

		
	length:function() {
		return this.rules.length;
	},
	
	setSubpart:function(_subpart) {
		this.subpart = _subpart=='' ? 'default' : _subpart;
	},

	// Test a ruleChain
	// - run a set of tests in the chain
	//		works backwards from at position "pos" in array, or -1  for the last
	//		separate tags object is required in case they've been dynamically retagged
	// - if they fail, return false
	// - if they succeed, and it's the last in the chain, return happily
	// - if they succeed, and there's more in the chain, rerun this for each parent until success

	test:function(pos, entity, tags, zoom) {
		// summary:		Test a rule chain by running all the tests in reverse order.
		if (this.rules.length==0) { return false; }
		if (pos==-1) { pos=this.rules.length-1; }
		
		var r=this.rules[pos];
		if (!r.test(entity, tags, zoom)) { return false; }
		if (pos==0) { return true; }
		
		var o=entity.parentObjects();
		for (var i=0; i<o.length; i++) {
			var p=o[i];
			if (this.test(pos-1, p, p.getTagsHash(), zoom)) { return true; }
		}
		return false;
	},

});

// ----------------------------------------------------------------------
// End of module
});
