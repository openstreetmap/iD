import { geoExtent } from '../geo';


export function osmNote() {
    if (!(this instanceof osmNote)) {
        return (new osmNote()).initialize(arguments);
    } else if (arguments.length) {
        this.initialize(arguments);
    }
}


osmNote.id = function() {
    return osmNote.id.next--;
};


osmNote.id.next = -1;


Object.assign(osmNote.prototype, {

    type: 'note',

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
            this.id = osmNote.id() + '';  // as string
        }

        return this;
    },

    extent: function() {
        return new geoExtent(this.loc);
    },

    update: function(attrs) {
        return osmNote(this, attrs); // {v: 1 + (this.v || 0)}
    },

    isNew: function() {
        return this.id < 0;
    },

    move: function(loc) {
        return this.update({ loc: loc });
    }

});
