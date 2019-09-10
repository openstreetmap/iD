import { geoExtent } from '../../geo';

/* Constants */
var EXTENT_CONSTRAINT = 250; // meter buffer around taskingTask for curtain

var MIN_ZOOM = 14;

export function taskingTask() {
    if (!(this instanceof taskingTask)) {
        return (new taskingTask()).initialize(arguments);
    } else if (arguments.length) {
        this.initialize(arguments);
    }
}


Object.assign(taskingTask.prototype, {

    type: 'taskingTask',

    initialize: function(sources) {
        for (var i = 0; i < sources.length; ++i) {
            var source = sources[i];
            for (var prop in source) {
                if (Object.prototype.hasOwnProperty.call(source, prop)) {
                    if (source[prop] === undefined) {
                        delete this[prop];
                    } else {
                        this[prop] = source[prop];
                    }
                }
            }
        }

        // calculate extent
        var coords = this.geometry.coordinates[0][0];
        this.properties.extent = new geoExtent(coords[3], coords[1]);

        // calculate center
        this.properties.center = this.properties.extent.center();

        // calculate extentPanConstraint
        var extentPanConstraint = new geoExtent(coords[3], coords[1]);
        this.properties.extentPanConstraint = extentPanConstraint.padByMeters(EXTENT_CONSTRAINT);

        // set starting minimum zoom
        this.properties.minZoom = MIN_ZOOM;

        return this;
    },

    id: function() {
        return this.properties.taskId;
    },

    extent: function() {
        return this.properties.extent;
    },

    center: function() {
        return this.properties.center;
    },

    extentPanConstraint: function() {
        return this.properties.extentPanConstraint;
    },


    minZoom: function(extentZoom) {
        if (!extentZoom || !arguments.length && !isNaN(extentZoom)) return this.properties.minZoom;

        this.properties.minZoom = extentZoom; // Math.floor(extentZoom) - MIN_ZOOM_PAD;

        return this.properties.minZoom;
    },

    projectId: function() {
        return this.properties.projectId;
    },

    status: function() {
        return this.properties.status;
    },

    history: function() {
        return this.properties.history;
    },

    comments: function() {
        return this.properties.comments;
    },

    instructions: function() {
        return this.properties.instructions;
    },

    perTaskInstructions: function() {
        return this.properties.perTaskInstructions;
    },

    lock: function(user) {

        var canLock = this.status !== 'locked'  && user.permissions.includes(this.status); // TODO: TAH - get user permissions

        if (canLock) {
            this.locked = true;
            this.status = 'lockedByYou';
        }

        return this;
    },

    unlock: function(status) {
        this.locked = false;
        this.status = status; // TODO: TAH - set status based on what user was doing & if they completed it
    },

    update: function(attrs) {
        return taskingTask(this, attrs); // {v: 1 + (this.v || 0)}
    },

});
