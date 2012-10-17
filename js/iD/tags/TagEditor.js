// iD/tags/TagEditor.js

define(['dojo/_base/declare','dojo/_base/lang','dojo/_base/xhr','dojo/dom-construct',
       'dijit/Dialog','dijit/form/Form','dijit/form/Button','dijit/form/TextBox'],
       function(declare,lang,xhr,domConstruct){

declare("iD.tags.TagEditor", null, {

	entity: null,
	controller: null,
	dialog: null,
	editorContainers: null,			// hash of DOM nodes to put editors in

	constructor:function(entity, controller) {
		// summary:		Construct a tag editor dialog box.
		this.entity = entity;
		this.controller = controller;
		this.editorContainers = {};

		// Create the dialog, and the form to put the editors in
		this.dialog = new dijit.Dialog({
            title: "Tags",
            content: "",
            style: "width: 300px" });

        this.$content = $('<div id="tagform"></div>');
        this.render();

		this.dialog.set('content', this.$content[0]);
		this.dialog.show();

        /*
        // What editors are relevant?
        var presetList = this.controller.presets[entity.entityType],
            applicablePresets = presetList.assembleEditorsForEntity(entity),
            i;

		// Add preset types
		for (i in applicablePresets.presets) {
			this.appendPreset(i, applicablePresets.presets[i], form.domNode);
		}

		// Add each editor
		for (i in applicablePresets.editors) {
			this.appendEditor(applicablePresets.editors[i], form.domNode);
		}
        */
	},

	// ------------
	// Presets

	render: function() {
        this.$content.empty();
        // TODO: optimize
        if (!$('#datalists').size()) {
            $(document.body).append('<div id="datalists"></div>');
        }
        _.each(this.entity.tags, _.bind(function(value, key) {
            var row = $('<div></div>'),
                keyid = 'key-' + key;

            $('<input></input>')
                .val(key)
                .attr({
                    'class': 'key'
                }).appendTo(row);

            $('<input></input>')
                .val(value)
                .attr({
                    'list': keyid,
                    'class': 'value'
                }).appendTo(row);
               
            // Share datalists between same-keys
            if (!$('datalist#' + keyid).size()) {
                iD.Taginfo.values(key, function(values) {

                    var $dl = $('<datalist></datalist>')
                        .attr('id', keyid);

                    _.each(values, function(v) {
                        $dl.append($('<option></option>')
                            .attr('value', v.value));
                    });

                    $('#datalists').append($dl);
                });
            }

            this.$content.append(row);
        }, this));
    },

	appendPreset:function(name, preset, destination) {
		var element = domConstruct.create('h2');
		element.appendChild(domConstruct.create('img', {
            src: 'presets/' + preset.icon
        }));
		element.appendChild(dojo.doc.createTextNode(name));
		destination.appendChild(element);
	},

	// ------------
	// Editors

	appendEditor:function(editor, destination) {
		// summary:		Request an editor (cached if available, XHR if not), and call renderEditor when it's available.
		if (this.controller.editorCache[editor]) {
			this.renderEditor(editor, destination);
		} else {
			$.ajax({
				url: "presets/editors/" + editor + ".json",
                // TODO: eliminate lang.hitch here
				success: lang.hitch(this, this.loadedEditor, editor, destination),
				error: function(err) {
                    // console.log("Couldn't load editor");
                }
			});
		}
	},

	loadedEditor: function(editor, destination, obj) {
		// summary:	Editor has loaded via XHR, so store it in the cache and render it.
		this.controller.editorCache[editor] = obj;
		this.renderEditor(editor, destination);
	},

	renderEditor: function(editor_name, destination) {
		// summary:	Render an editor as a form.
		editor = this.controller.editorCache[editor_name];

		// Add the subhead
		var element = domConstruct.create('h3');
		element.appendChild(dojo.doc.createTextNode(editor));
		destination.appendChild(element);

		// Add each form element
        // this.$content
		for (var label in editor) {
			var item = editor[label];
			var value = this.getTagValue(item.key);
			element = domConstruct.create('div');
			switch (item.type) {
				case 'text':
					var textbox = new dijit.form.TextBox({
                        name: item.key,
                        value: value,
                        type: 'text'
                    }, domConstruct.create('input'));
					element.appendChild(dojo.doc.createTextNode(label));
					element.appendChild(textbox.domNode);
					break;
				case 'dropdown':
				case 'relation':
				case 'hidden':
			}
			destination.appendChild(element);
		}
//		var submitbtn = new dijit.form.Button({ name: 'submit', type: 'submit', value: 'Submit', label: "Submit" }, dojo.doc.createElement('button'));
//		var resetbtn = new dijit.form.Button({ type: 'reset', label: 'Reset' }, dojo.doc.createElement('button'));
//		_destination.appendChild(submitbtn.domNode);
//		_destination.appendChild(resetbtn.domNode);
	}
});

// ----------------------------------------------------------------------
// End of module
});
