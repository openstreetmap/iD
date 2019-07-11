import { geoExtent } from '../geo';


export function task() {
    if (!(this instanceof task)) {
        return (new task()).initialize(arguments);
    } else if (arguments.length) {
        this.initialize(arguments);
    }
}


task.id = function() {
    return task.id.next--;
};


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

        if (!this.id) {
            this.id = task.id() + '';  // as string
        }

        return this;
    },

    extent: function() {
        return new geoExtent(this.geometry.coordinates);
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
