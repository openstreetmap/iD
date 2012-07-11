// iD/actions/UndoableEntityAction.js

define(['dojo/_base/declare','iD/actions/UndoableAction'], function(declare){

// ----------------------------------------------------------------------
// UndoableEntityAction class

declare("iD.actions.UndoableEntityAction", [iD.actions.UndoableAction], {

		wasDirty: false,
		connectionWasDirty: false,
		initialised: false,
		entity: null,

		constructor:function(_entity) {
			this.entity = _entity;
		},

		markDirty:function() {
			if (!this.initialised) this.init();
			if (!this.wasDirty) this.entity.markDirty();
			if (!this.connectionWasDirty) this.entity.connection.markDirty();
        },

		markClean:function() {
			if (!this.initialised) this.init();
			if (!this.wasDirty) this.entity.markClean();
			if (!this.connectionWasDirty) this.entity.connection.markClean();
		},

		// Record whether or not the entity and connection were clean before this action started
		init:function() {
			this.wasDirty = this.entity.isDirty();
			this.connectionWasDirty = this.entity.connection.isDirty();
			this.initialised = true;
		},

		toString:function() {
			return this.name + " " + this.entity.entityType + " " + this.entity.id;
		},
});

// ----------------------------------------------------------------------
// End of module
});
