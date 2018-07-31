import _extend from 'lodash-es/extend';


export function krError() {
    if (!(this instanceof krError)) {
        return (new krError()).initialize(arguments);
    } else if (arguments.length) {
        this.initialize(arguments);
    }
}


krError.id = function() {
    return krError.id.next--;
};


krError.id.next = -1;


_extend(krError.prototype, {

    type: 'krError',

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
            this.id = krError.id() + '';  // as string
        }

        return this;
    },

    update: function(attrs) {
        return krError(this, attrs); // {v: 1 + (this.v || 0)}
    }
});