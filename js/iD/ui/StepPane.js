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

	divname:null,
	stepsname:null,			// we probably don't want to have this
	currentStep:0,
	
	constructor:function(_divname,_stepsdivname) {
		this.divname=_divname;
		this.stepsname=_stepsdivname;
	},

	// Getters for the <div> containing the steps, and its individual nodes

	stepsDiv:function() { return document.getElementById(this.stepsname); },
	stepsNodes:function() { return this.stepsDiv().childNodes; },

	// Add/remove steps

	addStep:function(text) {
		this.stepsDiv().appendChild(document.createElement('li')).innerHTML=text;
	},
	setStep:function(pos,text) {
		if (this.stepsNodes().length<pos) { addStep(text); }
		else { this.stepsNodes()[pos].innerHTML=text; }
	},
	setSteps:function(steps) {
		this.clear();
		for (var i=0; i<steps.length; i++) {
			this.addStep(steps[i]);
		}
		return this;
	},
	clear:function() {
		for (var i=this.stepsNodes().length-1; i>=1; i--) {
			this.stepsDiv().removeChild(this.stepsNodes()[i]);
		}
	},

	// Change the highlighted step

	highlight:function(step) {
		this.show();
		this.currentStep=step;
		for (var i=1; i<this.stepsNodes().length; i++) {
			this.stepsNodes()[i].style.color = i==step ? 'black' : 'lightgray';
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
