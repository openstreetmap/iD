iD.styleparser.Style = function() {};

iD.styleparser.Style.prototype = {
	merged: false,
	edited: false,
	sublayer: 5,
	interactive: true,
	properties: [],
	styleType: 'Style',
	evals: {},

	constructor: function() {
	},

	drawn: function() {
		return false;
	},

	has: function(k) {
		return this.properties.indexOf(k)>-1;
	},
	
	mergeWith: function(additional) {
		for (var prop in this.properties) {
			if (additional[prop]) {
				this[prop]=additional[prop];
			}
		}
		this.merged=true;
	},
	
	setPropertyFromString: function(k,v,isEval) {
		this.edited=true;
		if (isEval) { this.evals[k]=v; return; }

		if (typeof(this[k])=='boolean') {
			v=Boolean(v);
		} else if (typeof(this[k])=='number') {
			v=Number(v);
		} else if (this[k] && this[k].constructor==Array) {
			v = v.split(',').map(function(a) { return Number(a); });
		}
		this[k]=v; 
		return true;
	},

	runEvals: function(tags) {
		for (var k in this.evals) {
            // TODO: kill
			this.setPropertyFromString(k, eval("with (tags) {"+this.evals[k]+"}"),false);
		}
	},
	
	dojoColor: function(rgb,a) {
		var b=rgb % 256;
		var g=(rgb-b) % 65536;
		var r=(rgb-b-g) % 16777216;
		return new dojo.Color([r/65536,g/256,b,a]);
	},

	toString: function() {
		var str = '';
		for (var k in this.properties) {
			if (this.hasOwnProperty(k)) { str+=k+"="+this[k]+"; "; }
		}
		return str;
	}
};


// ----------------------------------------------------------------------
// InstructionStyle class

iD.styleparser.InstructionStyle = function() {};
iD.styleparser.InstructionStyle.prototype = {
	set_tags: null,
	breaker: false,
	evals: {},
	styleType: 'InstructionStyle',
	addSetTag: function(k,v) {
		this.edited=true;
		if (!this.set_tags) this.set_tags={};
		this.set_tags[k]=v;
	}
};

// ----------------------------------------------------------------------
// PointStyle class

iD.styleparser.PointStyle = function() {};
iD.styleparser.PointStyle.prototype = {
	properties: ['icon_image','icon_width','icon_height','rotation'],
	icon_image: null,
	icon_width: 0,
	evals: {},
	icon_height: NaN,
	rotation: NaN,
	styleType: 'PointStyle',
	drawn:function() {
		return (this.icon_image !== null);
	},
	
	setPropertyFromString: function(k,v,isEval) {
		this.edited=true;
		if (isEval) { this.evals[k]=v; return; }

		if (typeof(this[k])=='boolean') {
			v=Boolean(v);
		} else if (typeof(this[k])=='number') {
			v=Number(v);
		} else if (this[k] && this[k].constructor==Array) {
			v = v.split(',').map(function(a) { return Number(a); });
		}
		this[k]=v; 
		return true;
	},



	has: function(k) {
		return this.properties.indexOf(k)>-1;
	},
	maxwidth:function() {
		return this.evals.icon_width ? 0 : this.icon_width;
	}
};

// ----------------------------------------------------------------------
// ShapeStyle class

iD.styleparser.ShapeStyle = function() {};

iD.styleparser.ShapeStyle.prototype = {
    properties: ['width','color','opacity','dashes','linecap','linejoin','line_style',
        'fill_image','fill_color','fill_opacity','casing_width','casing_color','casing_opacity','casing_dashes','layer'],

	width:0, color:NaN, opacity:NaN, dashes:[],
	linecap:null, linejoin:null, line_style:null,
	fill_image:null, fill_color:NaN, fill_opacity:NaN, 
	casing_width:NaN, casing_color:NaN, casing_opacity:NaN, casing_dashes:[],

	evals: {},
	layer:NaN,				// optional layer override (usually set by OSM tag)
	styleType: 'ShapeStyle',
	
	
	setPropertyFromString: function(k,v,isEval) {
		this.edited=true;
		if (isEval) { this.evals[k]=v; return; }

		if (typeof(this[k])=='boolean') {
			v=Boolean(v);
		} else if (typeof(this[k])=='number') {
			v=Number(v);
		} else if (this[k] && this[k].constructor==Array) {
			v = v.split(',').map(function(a) { return Number(a); });
		}
		this[k]=v; 
		return true;
	},



	has: function(k) {
		return this.properties.indexOf(k)>-1;
	},
	drawn:function() {
		return (this.fill_image || !isNaN(this.fill_color) || this.width || this.casing_width);
	},
	maxwidth:function() {
		// If width is set by an eval, then we can't use it to calculate maxwidth, or it'll just grow on each invocation...
		if (this.evals.width || this.evals.casing_width) { return 0; }
		return (this.width + (this.casing_width ? this.casing_width*2 : 0));
	},
	strokeStyler:function() {
		var cap,join;
		switch (this.linecap ) { case 'round': cap ='round'; break; case 'square': cap='square'; break; default: cap ='butt' ; break; }
		switch (this.linejoin) { case 'bevel': join='bevel'; break; case 'miter' : join=4      ; break; default: join='round'; break; }
		return {
			color: this.dojoColor(this.color ? this.color : 0, this.opacity ? this.opacity : 1),
			style: 'Solid',			// needs to parse dashes
			width: this.width,
			cap:   cap,
			join:  join
		};
	},
	shapeStrokeStyler:function() {
		if (isNaN(this.casing_color)) { return { width:0 }; }
		return {
			color: this.dojoColor(this.casing_color, this.casing_opacity ? this.casing_opacity : 1),
			width: this.casing_width ? this.casing_width : 1
		};
	},
	shapeFillStyler:function() {
		if (isNaN(this.color)) { return null; }
		return this.dojoColor(this.color, this.opacity ? this.opacity : 1);
	},
	fillStyler:function() {
		return this.dojoColor(this.fill_color, this.fill_opacity ? this.fill_opacity : 1);
	},
	casingStyler:function() {
		var cap,join;
		switch (this.linecap ) { case 'round': cap ='round'; break; case 'square': cap='square'; break; default: cap ='butt' ; break; }
		switch (this.linejoin) { case 'bevel': join='bevel'; break; case 'miter' : join=4      ; break; default: join='round'; break; }
		return {
			color: this.dojoColor(this.casing_color ? this.casing_color : 0, this.casing_opacity ? this.casing_opacity : 1),
			width: this.width+this.casing_width*2,
			style: 'Solid',
			cap:   cap,
			join:  join
		};
	}
};

// ----------------------------------------------------------------------
// TextStyle class

iD.styleparser.TextStyle = function() {};
iD.styleparser.TextStyle.prototype = {
    properties: ['font_family','font_bold','font_italic','font_caps','font_underline','font_size',
        'text_color','text_offset','max_width',
        'text','text_halo_color','text_halo_radius','text_center',
        'letter_spacing'],

    font_family: null,
    font_bold: false,
	font_italic: false,
	font_underline: false,
	font_caps: false,
	evals: {},
	font_size: NaN,
	text_color: NaN,
	text_offset: NaN,
	max_width: NaN,
	text: null,
	text_halo_color: NaN,
	text_halo_radius: 0,
	text_center: true,
	letter_spacing: 0,
	styleType: 'TextStyle',

	
	setPropertyFromString: function(k,v,isEval) {
		this.edited=true;
		if (isEval) { this.evals[k]=v; return; }

		if (typeof(this[k])=='boolean') {
			v=Boolean(v);
		} else if (typeof(this[k])=='number') {
			v=Number(v);
		} else if (this[k] && this[k].constructor==Array) {
			v = v.split(',').map(function(a) { return Number(a); });
		}
		this[k]=v; 
		return true;
	},


	drawn: function() {
		return (this.text !== null);
	},
	fontStyler:function() {
		return {
			family: this.font_family ? this.font_family : 'Arial',
			size: this.font_size ? this.font_size*2 : '10px' ,
			weight: this.font_bold ? 'bold' : 'normal',
			style: this.font_italic ? 'italic' : 'normal'
		};
	},
	textStyler:function(_text) {
		return {
			decoration: this.font_underline ? 'underline' : 'none',
			align: 'middle',
			text: _text
		};
	},

	has: function(k) {
		return this.properties.indexOf(k)>-1;
	},
	fillStyler:function() {
		// not implemented yet
		return this.dojoColor(0,1);
	}
	// getTextFormat, getHaloFilter, writeNameLabel
};

// ----------------------------------------------------------------------
// ShieldStyle class

iD.styleparser.ShieldStyle = function() {};

iD.styleparser.ShieldStyle.prototype = {
    properties: ['shield_image','shield_width','shield_height'],
	shield_image: null,
	shield_width: NaN,
	shield_height: NaN,
	evals: {},
	styleType: 'ShieldStyle',
	drawn:function() {
		return (shield_image !== null);
	}
};

// ----------------------------------------------------------------------
// End of module
