
export function taskingTasker() {
    if (!(this instanceof taskingTasker)) {
        var tasker = new taskingTasker();
        return tasker.initialize.apply(tasker, arguments);
    } else if (arguments.length) {
        this.initialize.apply(this, arguments);
    }
}


Object.assign(taskingTasker.prototype, {

    type: 'taskingTasker',

    initialize: function(source) {
        if (source) {
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
    }

});
