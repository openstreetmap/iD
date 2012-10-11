// iD/tags/PresetList.js
// List of presets for a given type (e.g. nodes, ways)

define(['dojo/_base/declare','dojo/_base/lang','dojo/_base/xhr'], function(declare,lang,xhr){

declare("iD.tags.PresetList", null, {

	entityType: null,
	presets: null,

	constructor:function(_type,_url) {
		// summary:		List of presets for a given type (e.g. nodes, ways)
		this.entityType=_type;

		dojo.xhrGet({
			url: _url,
			handleAs: "json",
			load: lang.hitch(this, this.loaded),
			error: function(err) { console.log("Couldn't load presets"); }
		});
	},
	
	loaded:function(_obj) {
		this.presets=_obj;
		console.log("Loaded presets for "+this.entityType);
	},
	
	assembleEditorsForEntity:function(_entity) {
		if (_entity.entityType!=this.entityType) return false;
		
		var editorList=[];
		for (var group in this.presets) {
			for (var preset in this.presets[group]) {
				var props=this.presets[group][preset];
				if (_entity.matchesTags(props.tags)) {
					for (var i in props.editors) {
						var editor=props.editors[i];
						if (editorList.indexOf(editor)==-1) { editorList.push(editor); }
					}
				}
			}
		}
		return editorList;
	}

});

// ----------------------------------------------------------------------
// End of module
});
