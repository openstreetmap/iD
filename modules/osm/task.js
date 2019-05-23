import { services } from '../../data/qa_errors.json';


export function task() {
    if (!(this instanceof task)) {
        return (new task()).initialize(arguments);
    } else if (arguments.length) {
        this.initialize(arguments);
    }
}

// Generic handling for services without nice IDs
task.id = function() {
    return task.id.next--;
};

task.id.next = -1;

Object.assign(task.prototype, {

    type: 'task',

    // All tasks need a position
    loc: [0, 0],

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

    update: function(attrs) {
        return task(this, attrs); // {v: 1 + (this.v || 0)}
    }
});
