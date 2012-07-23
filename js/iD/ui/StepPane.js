// iD/ui/StepPane.js

/*
	Step-by-step help pane.
*/

define(['dojo/_base/declare','dojo/_base/lang'], function(declare,lang){

// ----------------------------------------------------------------------
// StepPane class

declare("iD.ui.StepPane", null, {

	divname: null,
	stepsname: null,			// we probably don't want to have this
	currentStep: 0,
	order: null,
	
	constructor:function(_divname,_stepsdivname) {
		// summary:		Populates and creates the 'Step by step' how-to panel.
		//				This is a bit messy at present - it shouldn't take stepsname or similar, it should just
 		//				create the pane programmatically. We should also be able to set the title of the pane.
		this.divname=_divname;
		this.stepsname=_stepsdivname;
		this.order=[];
	},

	stepsDiv:function() {
		// summary:		Getter for the <div> containing the steps.
		return document.getElementById(this.stepsname);
	},
	stepsNodes:function() { 
		// summary:		Getter for the nodes of the <div> containing the steps.
		return this.stepsDiv().childNodes;
	},

	// ----------------
	// Add/remove steps

	addStep:function(name,text) {
		// summary:		Add a step to the end of the list.
		// name: String	A reference to this step (for example, 'start').
		// text: String	The text of the step.
		this.order.push(name);
		this.stepsDiv().appendChild(document.createElement('li')).innerHTML=text;
	},
	insertStep:function(pos,name,text) {
		// summary:		Insert a step at a position within the list.
		// pos: Number	The index at which to insert the step.
		// name: String	A reference to this step (for example, 'start').
		// text: String	The text of the step.
		this.order.splice(pos,0,name);
		this.stepsNodes()[pos+1].insertBefore(document.createElement('li')).innerHTML=text;
	},
	setSteps:function(steps,order) {
		// summary:		Set the entire list of steps.
		// steps: Object	A hash of each step, keyed by reference name. For example: { start: 'Click to begin', ... }
		// order: String	An array of the step names, in the desired order. For example: ['start','add','finish']
		this.clear();
		for (var i=0; i<order.length; i++) {
			this.addStep(order[i], steps[order[i]]);
		}
		return this;
	},
	clear:function() {
		// summary:		Remove all steps.
		for (var i=this.stepsNodes().length-1; i>=1; i--) {
			this.stepsDiv().removeChild(this.stepsNodes()[i]);
		}
		this.order=[];
	},

	// ---------------------------
	// Change the highlighted step

	highlight:function(stepname) {
		// summary:		Highlight the step with the specified name, and dim all others.
		this.show();
		this.currentStep=stepname;
		for (var i=1; i<this.stepsNodes().length; i++) {
			this.stepsNodes()[i].style.color = this.order[i-1]==stepname ? 'black' : 'lightgray';
		}
	},

	// ----------------
	// Show/hide window
	
	show:function() {
		// summary:		Show the window.
                if(dijit.byId(this.divname).domNode.style.visibility == 'hidden')
                    dijit.byId(this.divname).show();
                
                console.log(dijit.byId(this.divname));
	},
	hide:function() {
		// summary:		Hide the window.
		dijit.byId(this.divname).hide();
	}

});

// ----------------------------------------------------------------------
// End of module
});
