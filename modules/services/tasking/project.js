import { geoExtent } from '../../geo';


export function taskingProject() {
    if (!(this instanceof taskingProject)) {
        return (new taskingProject()).initialize(arguments);
    } else if (arguments.length) {
        this.initialize(arguments);
    }
}


Object.assign(taskingProject.prototype, {

    type: 'taskingProject',

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
        return this.properties.projectId;
    },

    extent: function() {
        return geoExtent(this.geometry.coordinates);
    },

    name: function() {
        return this.properties.name;
    },

    status: function() {
        return this.properties.status;
    },

    priority: function() {
        return this.properties.priority;
    },

    defaultLocale: function() {
        return this.properties.defaultLocale;
    },

    areaOfInterest: function() {
        return geoExtent(this.properties.areaOfInterest);
    },

    shortDescription: function() {
        return this.properties.shortDescription;
    },

    description: function() {
        return this.properties.description;
    },

    instructions: function() {
        return this.properties.instructions;
    },

    tasks: function() {
        return this.properties.tasks;
    },

    getTask: function(taskId) {
        return this.properties.tasks.features[taskId];
    }

    // lock: function(user) {

    //     var canLock = this.status !== 'locked'  && user.permissions.includes(this.status);

    //     if (canLock) {
    //         this.locked = true;
    //         this.status = 'lockedByYou';
    //     }

    //     return this;
    // },

    // unlock: function(status) {
    //     this.locked = false;
    //     this.status = status; // TODO: TAH - set status based on what user was doing & if they completed it
    // },

    // // update: function(attrs) {
    // //     return taskingProject(this, attrs); // {v: 1 + (this.v || 0)}
    // // },

});
