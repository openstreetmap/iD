// iD/styleparser/StyleChooser.js

define(['dojo/_base/declare','dojo/_base/lang','iD/styleparser/RuleChain'], function(declare,lang){

declare("iD.styleparser.StyleChooser", null, {

	// UpdateStyles doesn't support image-widths yet
	// or setting maxwidth/_width

	ruleChains:[],				// array of RuleChains (each one an array of Rules)
	styles:[],					// array of ShapeStyle/ShieldStyle/TextStyle/PointStyle
	zoomSpecific:false,			// are any of the rules zoom-specific?

	rcpos:0,
	stylepos:0,

	constructor:function() {
		// summary:		A combination of the selectors (ruleChains) and declaration (styles).
		//				For example, way[highway=footway] node[barrier=gate] { icon: gate.png; } is one StyleChooser.
		this.ruleChains=[new iD.styleparser.RuleChain()];
		this.styles=[];
	},

	currentChain:function() {
		return this.ruleChains[this.ruleChains.length-1];
	},

	newRuleChain:function() {
		// summary:		Starts a new ruleChain in this.ruleChains.
		if (this.ruleChains[this.ruleChains.length-1].length()>0) {
			this.ruleChains.push(new iD.styleparser.RuleChain());
		}
	},

	addStyles:function(a) {
		this.styles=this.styles.concat(a);
	},

	updateStyles:function(entity, tags, sl, zoom) {
		if (this.zoomSpecific) { sl.validAt=zoom; }

		// Are any of the ruleChains fulfilled?
		var w;
		for (var i in this.ruleChains) {
			var c=this.ruleChains[i];
			if (c.test(-1, entity, tags, zoom)) {
				sl.addSubpart(c.subpart);

				// Update StyleList
				for (var j in this.styles) {
					var r=this.styles[j];
					var a;
					switch (r.styleType) {

						case 'ShapeStyle' :	sl.maxwidth=Math.max(sl.maxwidth,r.maxwidth());
											a=sl.shapeStyles; break;
						case 'ShieldStyle':	a=sl.shieldStyles; break;
						case 'TextStyle'  :	a=sl.textStyles; break;
						case 'PointStyle' :	sl.maxwidth=Math.max(sl.maxwidth,r.maxwidth());
											a=sl.pointStyles; break;
						case 'InstructionStyle':
							if (InstructionStyle(r).breaker) { return; }
							for (var k in InstructionStyle(r).set_tags) { tags[k]=InstructionStyle(r).set_tags[k]; }
							break;
					}
					if (r.drawn) { tags[':drawn']='yes'; }
					tags._width = sl.maxwidth;
			
					r.runEvals(tags);
					if (a[c.subpart]) {
						// If there's already a style on this sublayer, then merge them
						// (making a deep copy if necessary to avoid altering the root style)
						if (!a[c.subpart].merged) { a[c.subpart]=lang.clone(a[c.subpart]); }
						a[c.subpart].mergeWith(r);
					} else {
						// Otherwise, just assign it
						a[c.subpart]=r;
					}
				}
			}
		}
	}
});

// ----------------------------------------------------------------------
// End of module
});
