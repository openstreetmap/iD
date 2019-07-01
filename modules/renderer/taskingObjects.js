import { geoExtent } from '../geo';


export function taskingProject() {
    if (!(this instanceof taskingProject)) {
        return (new taskingProject()).initialize(arguments);
    } else if (arguments.length) {
        this.initialize(arguments);
    }
}


Object.assign(taskingProject.prototype, {

    type: 'taskingProject',

    options: {
      status: 'disabled'
    },

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

    extent: function() {
        return new geoExtent(this.loc);
    },

    update: function(attrs) {
        return taskingProject(this, attrs);
    },
});


export function taskingTask() {
    if (!(this instanceof taskingTask)) {
        return (new taskingTask()).initialize(arguments);
    } else if (arguments.length) {
        this.initialize(arguments);
    }
}


Object.assign(taskingTask.prototype, {

    type: 'taskingTask',

    options: {
      status: 'disabled'
    },

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

    extent: function() {
        return new geoExtent(this.loc);
    },

    update: function(attrs) {
        return taskingTask(this, attrs);
    },
});