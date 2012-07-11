// iD/ui/StepPane.js

/*
	Step-by-step help pane.
*/

define(['dojo/_base/declare','dojo/_base/lang'], function(declare,lang){

// ----------------------------------------------------------------------
// StepPane class

// ******
// This is a bit messy at present - it shouldn't take stepsname or similar, it should just
// create the pane programmatically.
// ******
// We should also be able to set the title of the pane.

declare("iD.ui.StepPane", null, {

	divname: null,
	stepsname: null,			// we probably don't want to have this
	currentStep: 0,
	order: null,
	
	constructor:function(_divname,_stepsdivname) {
		this.divname=_divname;
		this.stepsname=_stepsdivname;
		this.order=[];
	},

	// Getters for the <div> containing the steps, and its individual nodes

	stepsDiv:function() { return document.getElementById(this.stepsname); },
	stepsNodes:function() { return this.stepsDiv().childNodes; },

	// Add/remove steps

	addStep:function(name,text) {
		this.order.push(name);
		this.stepsDiv().appendChild(document.createElement('li')).innerHTML=text;
	},
	insertStep:function(pos,name,text) {
		this.order.splice(pos,0,name);
		this.stepsNodes()[pos+1].insertBefore(document.createElement('li')).innerHTML=text;
	},
	setSteps:function(steps,order) {
		this.clear();
		for (var i=0; i<order.length; i++) {
			this.addStep(order[i], steps[order[i]]);
		}
		return this;
	},
	clear:function() {
		for (var i=this.stepsNodes().length-1; i>=1; i--) {
			this.stepsDiv().removeChild(this.stepsNodes()[i]);
		}
		this.order=[];
	},

	// Change the highlighted step

	highlight:function(stepname) {
		this.show();
		this.currentStep=stepname;
		for (var i=1; i<this.stepsNodes().length; i++) {
			this.stepsNodes()[i].style.color = this.order[i-1]==stepname ? 'black' : 'lightgray';
		}
	},

	// Show/hide window
	
	show:function() {
		dijit.byId(this.divname).show();
	},
	hide:function() {
		dijit.byId(this.divname).hide();
	},

});

// ----------------------------------------------------------------------
// End of module
});
