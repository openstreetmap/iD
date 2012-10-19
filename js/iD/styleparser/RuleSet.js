// iD/styleparser/RuleSet.js

define(['dojo/_base/xhr','dojo/_base/lang','dojo/_base/declare','dojo/_base/array','iD/styleparser/Style','iD/styleparser/StyleChooser','iD/styleparser/Condition','iD/styleparser/StyleList'], function(xhr,lang,declare,array){

// ----------------------------------------------------------------------
// RuleSet base class
// needs to cope with nested CSS files
// doesn't do untagged nodes optimisation

declare("iD.styleparser.RuleSet", null, {

	choosers: [],		// list of StyleChoosers
	callback: null,

	constructor:function() {
		// summary:		An entire stylesheet in parsed form.
		this.choosers=[];
	},

	registerCallback:function(callback) {
		// summary:		Set a callback function to be called when the CSS is loaded and parsed.
		this.callback=callback;
	},

	getStyles:function(entity, tags, zoom) {
		// summary:		Find the styles for a given entity.
		var sl=new iD.styleparser.StyleList();
		for (var i in this.choosers) {
			this.choosers[i].updateStyles(entity, tags, sl, zoom);
		}
		return sl;	// iD.styleparser.StyleList
	},

	loadFromCSS:function(url) {
		// summary:		Load a MapCSS file from a URL, then throw it at the parser when it's loaded.
		xhr.get({ url: url, load: lang.hitch(this, "parseCSS") });
	},

	parseCSS:function(css) {
		// summary:		Parse a CSS document into a set of StyleChoosers.
		var previous=0;								// what was the previous CSS word?
		var sc=new iD.styleparser.StyleChooser();	// currently being assembled
		this.choosers=[];
		css = css.replace(/[\r\n]/g,"");				// strip linebreaks because JavaScript doesn't have the /s modifier

		var o={};
		while (css.length>0) {

			// CSS comment
			if ((o=this.COMMENT.exec(css))) {
				css=css.replace(this.COMMENT,'');

			// Whitespace (probably only at beginning of file)
			} else if ((o=this.WHITESPACE.exec(css))) {
				css=css.replace(this.WHITESPACE,'');

			// Class - .motorway, .builtup, :hover
			} else if ((o=this.CLASS.exec(css))) {
				if (previous==this.oDECLARATION) { this.saveChooser(sc); sc=new iD.styleparser.StyleChooser(); }

				css=css.replace(this.CLASS,'');
				sc.currentChain().addConditionToLast(new iD.styleparser.Condition('set',o[1]));
				previous=this.oCONDITION;

			// Not class - !.motorway, !.builtup, !:hover
			} else if ((o=this.NOT_CLASS.exec(css))) {
				if (previous==this.oDECLARATION) { this.saveChooser(sc); sc=new iD.styleparser.StyleChooser(); }

				css=css.replace(this.NOT_CLASS,'');
				sc.currentChain().addConditionToLast(new iD.styleparser.Condition('unset',o[1]));
				previous=this.oCONDITION;

			// Zoom
			} else if ((o=this.ZOOM.exec(css))) {
				if (previous!=this.oOBJECT && previous!=this.oCONDITION) { sc.currentChain().addRule(); }

				css=css.replace(this.ZOOM,'');
				var z=parseZoom(o[1]);
				sc.currentChain().addZoomToLast(z[0],z[1]);
				sc.zoomSpecific=true;
				previous=this.oZOOM;

			// Grouping - just a comma
			} else if ((o=this.GROUP.exec(css))) {
				css=css.replace(this.GROUP,'');
				sc.newRuleChain();
				previous=this.oGROUP;

			// Condition - [highway=primary]
			} else if ((o=this.CONDITION.exec(css))) {
				if (previous==this.oDECLARATION) { this.saveChooser(sc); sc=new iD.styleparser.StyleChooser(); }
				if (previous!=this.oOBJECT && previous!=this.oZOOM && previous!=this.oCONDITION) { sc.currentChain().addRule(); }
				css=css.replace(this.CONDITION,'');
				sc.currentChain().addConditionToLast(this.parseCondition(o[1]));
				previous=this.oCONDITION;

			// Object - way, node, relation
			} else if ((o=this.OBJECT.exec(css))) {
				if (previous==this.oDECLARATION) { this.saveChooser(sc); sc=new iD.styleparser.StyleChooser(); }

				css=css.replace(this.OBJECT,'');
				sc.currentChain().addRule(o[1]);
				previous=this.oOBJECT;

			// Subpart - ::centreline
			} else if ((o=this.SUBPART.exec(css))) {
				if (previous==this.oDECLARATION) { this.saveChooser(sc); sc=new iD.styleparser.StyleChooser(); }
				css=css.replace(this.SUBPART,'');
				sc.currentChain().setSubpart(o[1]);
				previous=this.oSUBPART;

			// Declaration - {...}
			} else if ((o=this.DECLARATION.exec(css))) {
				css=css.replace(this.DECLARATION,'');
				sc.addStyles(this.parseDeclaration(o[1]));
				previous=this.oDECLARATION;
			
			// Unknown pattern
			} else if ((o=this.UNKNOWN.exec(css))) {
				css=css.replace(this.UNKNOWN,'');
				// console.log("unknown: "+o[1]);

			} else {
				// console.log("choked on "+css);
				return;
			}
		}
		if (previous==this.oDECLARATION) { this.saveChooser(sc); sc=new iD.styleparser.StyleChooser(); }
		if (this.callback) { this.callback(); }
	},

	saveChooser:function(sc) {
		this.choosers.push(sc);
	},
	
	parseDeclaration:function(s) {
		var styles=[];
		var t={};
		var o={};
		var k, v;

		// Create styles
		var ss = new iD.styleparser.ShapeStyle();
		var ps = new iD.styleparser.PointStyle();
		var ts = new iD.styleparser.TextStyle();
		var hs = new iD.styleparser.ShieldStyle();
		var xs = new iD.styleparser.InstructionStyle();

		var r=s.split(';');
		var isEval={};
		for (var i in r) {
			var a=r[i];
			if ((o=this.ASSIGNMENT_EVAL.exec(a)))   { k=o[1].replace(this.DASH,'_'); t[k]=o[2]; isEval[k]=true; }
			else if ((o=this.ASSIGNMENT.exec(a)))   { k=o[1].replace(this.DASH,'_'); t[k]=o[2]; }
			else if ((o=this.SET_TAG_EVAL.exec(a))) { } // xs.addSetTag(o[1],this.saveEval(o[2]));
			else if ((o=this.SET_TAG.exec(a)))      { xs.addSetTag(o[1],o[2]); }
			else if ((o=this.SET_TAG_TRUE.exec(a))) { xs.addSetTag(o[1],true); }
			else if ((o=this.EXIT.exec(a)))         { xs.setPropertyFromString('breaker',true); }
		}

		// Find sublayer
		var sub=5;
		if (t['z_index']) { sub=Number(t['z_index']); delete t['z_index']; }
		ss.sublayer=ps.sublayer=ts.sublayer=hs.sublayer=sub;
		xs.sublayer=10;

		// Find "interactive" property - it's true unless explicitly set false
		var inter=true;
		if (t['interactive']) { inter=t['interactive'].match(this.FALSE) ? false : true; delete t['interactive']; }
		ss.interactive=ps.interactive=ts.interactive=hs.interactive=xs.interactive=inter;

        // Munge special values
        // (we should stop doing this and do it in the style instead)
        if (t['font_weight']    ) { t['font_bold'  ]    = t['font_weight'    ].match(this.BOLD  )    ? true : false; delete t['font_weight']; }
        if (t['font_style']     ) { t['font_italic']    = t['font_style'     ].match(this.ITALIC)    ? true : false; delete t['font_style']; }
        if (t['text_decoration']) { t['font_underline'] = t['text_decoration'].match(this.UNDERLINE) ? true : false; delete t['text_decoration']; }
        if (t['text_position']  ) { t['text_center']    = t['text_position'  ].match(this.CENTER)    ? true : false; delete t['text_position']; }
        if (t['text_transform']) {
            if (t['text_transform'].match(this.CAPS)) { t['font_caps']=true; } else { t['font_caps']=false; }
            delete t['text_transform'];
        }

        // Assign each property to the appropriate style
        for (a in t) {
            // Parse properties
            // ** also do units, e.g. px/pt/m
            if (a.match(this.COLOR)) { v = this.parseCSSColor(t[a]); }
            else { v = t[a]; }

            // Set in styles
            if      (ss.has(a)) { ss.setPropertyFromString(a,v,isEval[a]); }
            else if (ps.has(a)) { ps.setPropertyFromString(a,v,isEval[a]); }
            else if (ts.has(a)) { ts.setPropertyFromString(a,v,isEval[a]); }
            else if (hs.has(a)) { hs.setPropertyFromString(a,v,isEval[a]); }
            else {
                // console.log(a+" not found");
            }
        }

        // Add each style to list
		if (ss.edited) { styles.push(ss); }
		if (ps.edited) { styles.push(ps); }
		if (ts.edited) { styles.push(ts); }
		if (hs.edited) { styles.push(hs); }
		if (xs.edited) { styles.push(xs); }
		return styles;
	},

	parseZoom:function(s) {
		var o={};
		if      ((o=this.ZOOM_MINMAX.exec(s))) { return [o[1],o[2]]; }
		else if ((o=this.ZOOM_MIN.exec(s)   )) { return [o[1], maxscale]; }
		else if ((o=this.ZOOM_MAX.exec(s)   )) { return [minscale, o[1]]; }
		else if ((o=this.ZOOM_SINGLE.exec(s))) { return [o[1],o[1]]; }
		return null;
	},

	parseCondition:function(s) {
		var o={};
		if      ((o=this.CONDITION_TRUE.exec(s)))  { return new iD.styleparser.Condition('true'	,o[1]); }
		else if ((o=this.CONDITION_FALSE.exec(s))) { return new iD.styleparser.Condition('false',o[1]); }
		else if ((o=this.CONDITION_SET.exec(s)))   { return new iD.styleparser.Condition('set'	,o[1]); }
		else if ((o=this.CONDITION_UNSET.exec(s))) { return new iD.styleparser.Condition('unset',o[1]); }
		else if ((o=this.CONDITION_NE.exec(s)))    { return new iD.styleparser.Condition('ne'	,o[1],o[2]); }
		else if ((o=this.CONDITION_GT.exec(s)))    { return new iD.styleparser.Condition('>'	,o[1],o[2]); }
		else if ((o=this.CONDITION_GE.exec(s)))    { return new iD.styleparser.Condition('>='	,o[1],o[2]); }
		else if ((o=this.CONDITION_LT.exec(s)))    { return new iD.styleparser.Condition('<'	,o[1],o[2]); }
		else if ((o=this.CONDITION_LE.exec(s)))    { return new iD.styleparser.Condition('<='	,o[1],o[2]); }
		else if ((o=this.CONDITION_REGEX.exec(s))) { return new iD.styleparser.Condition('regex',o[1],o[2]); }
		else if ((o=this.CONDITION_EQ.exec(s)))    { return new iD.styleparser.Condition('eq'	,o[1],o[2]); }
		return null;
	},

	parseCSSColor:function(colorStr) {
		colorStr = colorStr.toLowerCase();
		if (this.CSSCOLORS[colorStr]) {
			return this.CSSCOLORS[colorStr];
		} else {
			var match = this.HEX.exec(colorStr);
			if ( match ) { 
                if ( match[1].length == 3) {
                    // repeat digits. #abc => 0xaabbcc
                    return Number("0x"+match[1].charAt(0)+match[1].charAt(0)+
                                  match[1].charAt(1)+match[1].charAt(1)+
                                  match[1].charAt(2)+match[1].charAt(2));
                } else if ( match[1].length == 6) {
					return Number("0x"+match[1]);
				} else {
					return Number("0x000000"); //as good as any
				}
			}
		}
		return 0;
	},

	// Regular expression tests and other constants

	WHITESPACE	:/^\s+/,
	COMMENT		:/^\/\*.+?\*\/\s*/,
	CLASS		:/^([\.:]\w+)\s*/,
	NOT_CLASS	:/^!([\.:]\w+)\s*/,
	ZOOM		:/^\|\s*z([\d\-]+)\s*/i,
	GROUP		:/^,\s*/i,
	CONDITION	:/^\[(.+?)\]\s*/,
	OBJECT		:/^(\w+)\s*/,
	DECLARATION	:/^\{(.+?)\}\s*/,
	SUBPART		:/^::(\w+)\s*/,
	UNKNOWN		:/^(\S+)\s*/,

	ZOOM_MINMAX	:/^(\d+)\-(\d+)$/,
	ZOOM_MIN	:/^(\d+)\-$/,
	ZOOM_MAX	:/^\-(\d+)$/,
	ZOOM_SINGLE	:/^(\d+)$/,

	CONDITION_TRUE      :/^\s*([:\w]+)\s*=\s*yes\s*$/i,
	CONDITION_FALSE     :/^\s*([:\w]+)\s*=\s*no\s*$/i,
	CONDITION_SET       :/^\s*([:\w]+)\s*$/,
	CONDITION_UNSET     :/^\s*!([:\w]+)\s*$/,
	CONDITION_EQ        :/^\s*([:\w]+)\s*=\s*(.+)\s*$/,
	CONDITION_NE        :/^\s*([:\w]+)\s*!=\s*(.+)\s*$/,
	CONDITION_GT        :/^\s*([:\w]+)\s*>\s*(.+)\s*$/,
	CONDITION_GE        :/^\s*([:\w]+)\s*>=\s*(.+)\s*$/,
	CONDITION_LT        :/^\s*([:\w]+)\s*<\s*(.+)\s*$/,
	CONDITION_LE        :/^\s*([:\w]+)\s*<=\s*(.+)\s*$/,
	CONDITION_REGEX     :/^\s*([:\w]+)\s*=~\/\s*(.+)\/\s*$/,

	ASSIGNMENT_EVAL	:/^\s*(\S+)\s*\:\s*eval\s*\(\s*'(.+?)'\s*\)\s*$/i,
	ASSIGNMENT		:/^\s*(\S+)\s*\:\s*(.+?)\s*$/,
	SET_TAG_EVAL	:/^\s*set\s+(\S+)\s*=\s*eval\s*\(\s*'(.+?)'\s*\)\s*$/i,
	SET_TAG			:/^\s*set\s+(\S+)\s*=\s*(.+?)\s*$/i,
	SET_TAG_TRUE	:/^\s*set\s+(\S+)\s*$/i,
    EXIT			:/^\s*exit\s*$/i,

    oZOOM: 			2,
    oGROUP: 		3,
    oCONDITION: 	4,
    oOBJECT: 		5,
    oDECLARATION: 	6,
    oSUBPART: 		7,

    DASH: 	/\-/g,
	COLOR: 	/color$/,
	BOLD: 	/^bold$/i,
	ITALIC: /^italic|oblique$/i,
	UNDERLINE: /^underline$/i,
	CAPS: 	/^uppercase$/i,
	CENTER: /^center$/i,
	FALSE: 	/^(no|false|0)$/i,

	HEX: 	/^#([0-9a-f]+)$/i,

	CSSCOLORS: {
		aliceblue:0xf0f8ff,
		antiquewhite:0xfaebd7,
		aqua:0x00ffff,
		aquamarine:0x7fffd4,
		azure:0xf0ffff,
		beige:0xf5f5dc,
		bisque:0xffe4c4,
		black:0x000000,
		blanchedalmond:0xffebcd,
		blue:0x0000ff,
		blueviolet:0x8a2be2,
		brown:0xa52a2a,
		burlywood:0xdeb887,
		cadetblue:0x5f9ea0,
		chartreuse:0x7fff00,
		chocolate:0xd2691e,
		coral:0xff7f50,
		cornflowerblue:0x6495ed,
		cornsilk:0xfff8dc,
		crimson:0xdc143c,
		cyan:0x00ffff,
		darkblue:0x00008b,
		darkcyan:0x008b8b,
		darkgoldenrod:0xb8860b,
		darkgray:0xa9a9a9,
		darkgreen:0x006400,
		darkkhaki:0xbdb76b,
		darkmagenta:0x8b008b,
		darkolivegreen:0x556b2f,
		darkorange:0xff8c00,
		darkorchid:0x9932cc,
		darkred:0x8b0000,
		darksalmon:0xe9967a,
		darkseagreen:0x8fbc8f,
		darkslateblue:0x483d8b,
		darkslategray:0x2f4f4f,
		darkturquoise:0x00ced1,
		darkviolet:0x9400d3,
		deeppink:0xff1493,
		deepskyblue:0x00bfff,
		dimgray:0x696969,
		dodgerblue:0x1e90ff,
		firebrick:0xb22222,
		floralwhite:0xfffaf0,
		forestgreen:0x228b22,
		fuchsia:0xff00ff,
		gainsboro:0xdcdcdc,
		ghostwhite:0xf8f8ff,
		gold:0xffd700,
		goldenrod:0xdaa520,
		gray:0x808080,
		green:0x008000,
		greenyellow:0xadff2f,
		honeydew:0xf0fff0,
		hotpink:0xff69b4,
		indianred:0xcd5c5c,
		indigo:0x4b0082,
		ivory:0xfffff0,
		khaki:0xf0e68c,
		lavender:0xe6e6fa,
		lavenderblush:0xfff0f5,
		lawngreen:0x7cfc00,
		lemonchiffon:0xfffacd,
		lightblue:0xadd8e6,
		lightcoral:0xf08080,
		lightcyan:0xe0ffff,
		lightgoldenrodyellow:0xfafad2,
		lightgrey:0xd3d3d3,
		lightgreen:0x90ee90,
		lightpink:0xffb6c1,
		lightsalmon:0xffa07a,
		lightseagreen:0x20b2aa,
		lightskyblue:0x87cefa,
		lightslategray:0x778899,
		lightsteelblue:0xb0c4de,
		lightyellow:0xffffe0,
		lime:0x00ff00,
		limegreen:0x32cd32,
		linen:0xfaf0e6,
		magenta:0xff00ff,
		maroon:0x800000,
		mediumaquamarine:0x66cdaa,
		mediumblue:0x0000cd,
		mediumorchid:0xba55d3,
		mediumpurple:0x9370d8,
		mediumseagreen:0x3cb371,
		mediumslateblue:0x7b68ee,
		mediumspringgreen:0x00fa9a,
		mediumturquoise:0x48d1cc,
		mediumvioletred:0xc71585,
		midnightblue:0x191970,
		mintcream:0xf5fffa,
		mistyrose:0xffe4e1,
		moccasin:0xffe4b5,
		navajowhite:0xffdead,
		navy:0x000080,
		oldlace:0xfdf5e6,
		olive:0x808000,
		olivedrab:0x6b8e23,
		orange:0xffa500,
		orangered:0xff4500,
		orchid:0xda70d6,
		palegoldenrod:0xeee8aa,
		palegreen:0x98fb98,
		paleturquoise:0xafeeee,
		palevioletred:0xd87093,
		papayawhip:0xffefd5,
		peachpuff:0xffdab9,
		peru:0xcd853f,
		pink:0xffc0cb,
		plum:0xdda0dd,
		powderblue:0xb0e0e6,
		purple:0x800080,
		red:0xff0000,
		rosybrown:0xbc8f8f,
		royalblue:0x4169e1,
		saddlebrown:0x8b4513,
		salmon:0xfa8072,
		sandybrown:0xf4a460,
		seagreen:0x2e8b57,
		seashell:0xfff5ee,
		sienna:0xa0522d,
		silver:0xc0c0c0,
		skyblue:0x87ceeb,
		slateblue:0x6a5acd,
		slategray:0x708090,
		snow:0xfffafa,
		springgreen:0x00ff7f,
		steelblue:0x4682b4,
		tan:0xd2b48c,
		teal:0x008080,
		thistle:0xd8bfd8,
		tomato:0xff6347,
		turquoise:0x40e0d0,
		violet:0xee82ee,
		wheat:0xf5deb3,
		white:0xffffff,
		whitesmoke:0xf5f5f5,
		yellow:0xffff00,
		yellowgreen:0x9acd32 },

});

// ----------------------------------------------------------------------
// End of module
});
