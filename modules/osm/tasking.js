import { geoExtent } from '../geo';


export function tasking() {
    if (!(this instanceof tasking)) {
        return (new tasking()).initialize(arguments);
    } else if (arguments.length) {
        this.initialize(arguments);
    }
}


Object.assign(tasking.prototype, {

    type: 'tasking',

    options: {
      status: 'disabled'
    }

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
            this.id = tasking.id() + '';  // as string
        }

        return this;
    },

    update: function(attrs) {
        return tasking(this, attrs); // {v: 1 + (this.v || 0)}
    },

});
