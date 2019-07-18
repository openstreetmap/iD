import { geoExtent } from '../geo';


export function task() {
    if (!(this instanceof task)) {
        return (new task()).initialize(arguments);
    } else if (arguments.length) {
        this.initialize(arguments);
    }
}


Object.assign(task.prototype, {

    type: 'task',

    locked: false,

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

        return this;
    },

    id: function() {
        return this.properties.taskId;
    },

    extent: function() {
        return new geoExtent(this.geometry.coordinates);
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

    description: function() {
        return this.properties.description;
    },

    instructions: function() {
        return this.properties.instructions;
    },

    lock: function(user) {

        var canLock = this.status !== 'locked'  && user.permissions.includes(this.status);

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

    // update: function(attrs) {
    //     return task(this, attrs); // {v: 1 + (this.v || 0)}
    // },

});
