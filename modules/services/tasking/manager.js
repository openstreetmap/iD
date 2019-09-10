export function taskingManager() {
    if (!(this instanceof taskingManager)) {
        return (new taskingManager()).initialize(arguments);
    } else if (arguments.length) {
        this.initialize(arguments);
    }
}


Object.assign(taskingManager.prototype, {

    type: 'taskingManager',

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
});
