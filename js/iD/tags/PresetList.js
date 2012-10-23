// iD/tags/PresetList.js
// List of presets for a given type (e.g. nodes, ways)

define(['dojo/_base/declare'], function(declare) {

declare("iD.tags.PresetList", null, {

	entityType: null,
	presets: null,

	constructor:function(type, url) {
		// summary:		List of presets for a given type (e.g. nodes, ways)
		this.entityType = type;

		$.ajax({
			url: url,
			success: _.bind(this.loaded, this),
			error: function(err) { console.log("Couldn't load presets for " + type); }
		});
	},

	loaded: function(obj) {
		this.presets = obj;
		// console.log("Loaded presets for " + this.entityType);
	},

    // This entity has all of the same tags as props, with all of the same
    // values. It may have additional tags that are not in props.
    matchesTags: function(entity, props) {
        for (var k in props) {
			if (!entity.tags[k] || entity.tags[k] !== props[k]) return false;
		}
		return true;
    },

	assembleEditorsForEntity:function(entity) {
		if (entity.entityType != this.entityType) return false;

		var presetList = {};
		var editorList = [];
		for (var group in this.presets) {
			for (var preset in this.presets[group]) {
				var props = this.presets[group][preset];
				if (this.matchesTags(entity, props.tags)) {
					presetList[preset] = props;
					for (var i in props.edtors) {
						var editor = props.editors[i];
						if (editorList.indexOf(editor) === -1) {
                            editorList.push(editor);
                        }
					}
				}
			}
		}
		return {
            presets: presetList,
            editors: editorList
        };
	}
});

// ----------------------------------------------------------------------
// End of module
});
