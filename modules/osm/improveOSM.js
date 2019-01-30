import _extend from 'lodash-es/extend';


export function iOsmError() {
    if (!(this instanceof iOsmError)) {
        return (new iOsmError()).initialize(arguments);
    } else if (arguments.length) {
        this.initialize(arguments);
    }
}

// ImproveOSM has no error IDs unfortunately
// So no way to explicitly refer to each error in their DB
iOsmError.id = function() {
    return iOsmError.id.next--;
};


iOsmError.id.next = -1;


_extend(iOsmError.prototype, {

    type: 'iOsmError',
    source: 'iOSM',

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
            this.id = iOsmError.id() + '';  // as string
        }

        return this;
    },

    update: function(attrs) {
        return iOsmError(this, attrs); // {v: 1 + (this.v || 0)}
    }
});
