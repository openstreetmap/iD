// iD/ui/StepPane.js

/*
	Step-by-step help pane.
*/

define(['dojo/_base/declare'], function(declare) {

// ----------------------------------------------------------------------
// StepPane class

declare("iD.ui.StepPane", null, {

	currentStep: 0,
	constructor:function() {
	},
	// ---------------------------
	// Change the highlighted step

	message: function(x) {
        this.show();
        $('<div></div>')
            .appendTo('#road-help')
            .attr('class', 'manual')
            .text(x);
        return this;
    },

	step: function(x) {
		// summary:		Highlight the step with the specified name, and dim all others.
		this.show();
        $('#road-help div').eq(x).show();
        return this;
	},

	// ----------------
	// Show/hide window
	show: function() {
		// summary:		Show the window.
        $('#road-help').show();
        $('#road-help div').hide();
        $('#road-help .manual').remove();
        return this;
	},
	hide: function() {
        $('#road-help').hide();
        $('#road-help div').hide();
        return this;
	}
});

// ----------------------------------------------------------------------
// End of module
});
