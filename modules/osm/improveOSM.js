import _extend from 'lodash-es/extend';


export function impOsmError() {
    if (!(this instanceof impOsmError)) {
        return (new impOsmError()).initialize(arguments);
    } else if (arguments.length) {
        this.initialize(arguments);
    }
}

// ImproveOSM has no error IDs unfortunately
// So no way to explicitly refer to each error in their DB
impOsmError.id = function() {
    return impOsmError.id.next--;
};


impOsmError.id.next = -1;


_extend(impOsmError.prototype, {

    type: 'impOsmError',

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
            this.id = impOsmError.id() + '';  // as string
        }

        return this;
    },

    update: function(attrs) {
        return impOsmError(this, attrs); // {v: 1 + (this.v || 0)}
    }
});
