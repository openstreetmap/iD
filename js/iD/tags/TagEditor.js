// iD/tags/TagEditor.js

define(['dojo/_base/declare','dojo/_base/lang','dojo/_base/xhr','dojo/dom-construct',
        'dijit/Dialog','dijit/form/Form','dijit/form/Button','dijit/form/TextBox'],
       function(declare,lang,xhr,domConstruct){

declare("iD.tags.TagEditor", null, {

	entity: null,
	controller: null,
	dialog: null,
	editorContainers: null,			// hash of DOM nodes to put editors in

	constructor:function(_entity,_controller) {
		// summary:		Construct a tag editor dialog box.
		console.log("TagEditor constructor");
		this.entity=_entity;
		this.controller=_controller;
		this.editorContainers={};

		// Create the dialog, and the form to put the editors in

		this.dialog = new dijit.Dialog({ title: "My Dialog", content: "Test content.", style: "width: 300px" });
		var form = new dijit.form.Form({ encType: 'multipart/form-data', action: '', method: '',
			onSubmit: function(event) { console.log('submit'); }
		}, dojo.doc.createElement('div'));
		this.dialog.set('content',form);
		this.dialog.show();

		// Add each editor
		var presetList=this.controller.presets[_entity.entityType];
		var editors=presetList.assembleEditorsForEntity(_entity);
		for (var i in editors) {
			var editor=editors[i];
			this.appendEditor(editor,form.domNode);
		}
	},
	
	appendEditor:function(_editor,_destination) {
		// summary:		Request an editor (cached if available, XHR if not), and call renderEditor when it's available.
		if (this.controller.editorCache[_editor]) {
			this.renderEditor(_editor,_destination);
		} else {
			dojo.xhrGet({
				url: "presets/editors/"+_editor+".json",
				handleAs: "json",
				load: lang.hitch(this, this.loadedEditor, _editor, _destination),
				error: function(err) { console.log("Couldn't load editor"); }
			});
		}
	},
	
	loadedEditor:function(_editor,_destination,_obj) {
		// summary: 	Editor has loaded via XHR, so store it in the cache and render it.
		this.controller.editorCache[_editor]=_obj;
		this.renderEditor(_editor,_destination);
	},
	
	renderEditor:function(_editor,_destination) {
		// summary: 	Render an editor as a form.
		var editor=this.controller.editorCache[_editor];

		// Add the subhead
		var element=domConstruct.create('h3');
		element.appendChild(dojo.doc.createTextNode(_editor));
		_destination.appendChild(element);

		// Add each form element
		for (var label in editor) {
			var item=editor[label];
			var value=this.getTagValue(item.key);
			element=domConstruct.create('div');
			switch (item.type) {
				case 'text':
					var textbox = new dijit.form.TextBox({ name: item.key, value: value, type: 'text' }, domConstruct.create('input'));
					element.appendChild(dojo.doc.createTextNode(label));
					element.appendChild(textbox.domNode);
					break;
				case 'dropdown':
				case 'relation':
				case 'hidden':
			}
			_destination.appendChild(element);
		}
//		var submitbtn = new dijit.form.Button({ name: 'submit', type: 'submit', value: 'Submit', label: "Submit" }, dojo.doc.createElement('button'));
//		var resetbtn = new dijit.form.Button({ type: 'reset', label: 'Reset' }, dojo.doc.createElement('button'));
//		_destination.appendChild(submitbtn.domNode);
//		_destination.appendChild(resetbtn.domNode);
	},
	
	getTagValue:function(k) {
		// summary: 	Get the value of a tag for the current entity, or empty string if unset.
		return this.entity.tags[k] ? this.entity.tags[k] : '';
	},

});

// ----------------------------------------------------------------------
// End of module
});
