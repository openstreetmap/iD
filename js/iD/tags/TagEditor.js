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

		var form = new dijit.form.Form({
            encType: 'multipart/form-data',
            action: '',
            method: '',
			onSubmit: function(event) { console.log('submit'); }
		}, dojo.doc.createElement('div'));

		this.dialog.set('content', form);
		this.dialog.show();

		// What editors are relevant?
		var presetList = this.controller.presets[entity.entityType];
		var applicablePresets = presetList.assembleEditorsForEntity(entity);

        var i;
		// Add preset types
		for (i in applicablePresets.presets) {
			this.appendPreset(i, applicablePresets.presets[i], form.domNode);
		}

		// Add each editor
		for (i in applicablePresets.editors) {
			this.appendEditor(applicablePresets.editors[i], form.domNode);
		}
	},

	// ------------
	// Presets

	appendPreset:function(name, preset, destination) {
		var element=domConstruct.create('h2');
		element.appendChild(domConstruct.create('img', { src: 'presets/' + preset.icon }));
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
			dojo.xhrGet({
				url: "presets/editors/"+_editor+".json",
				handleAs: "json",
                // TODO: eliminate lang.hitch here
				load: lang.hitch(this, this.loadedEditor, editor, destination),
				error: function(err) { console.log("Couldn't load editor"); }
			});
		}
	},

	loadedEditor: function(editor, destination, obj) {
		// summary:	Editor has loaded via XHR, so store it in the cache and render it.
		this.controller.editorCache[editor] = obj;
		this.renderEditor(editor, destination);
	},

	renderEditor: function(_editor, destination) {
		// summary:	Render an editor as a form.
		var editor=this.controller.editorCache[_editor];

		// Add the subhead
		var element=domConstruct.create('h3');
		element.appendChild(dojo.doc.createTextNode(_editor));
		destination.appendChild(element);

		// Add each form element
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
	},

	getTagValue:function(k) {
		// summary:	Get the value of a tag for the current entity, or empty string if unset.
		return this.entity.tags[k] ? this.entity.tags[k] : '';
	}
});

// ----------------------------------------------------------------------
// End of module
});
