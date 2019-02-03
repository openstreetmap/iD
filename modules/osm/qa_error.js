import _extend from 'lodash-es/extend';
import { services } from '../../data/qa_errors.json';

export function qaError() {
    if (!(this instanceof qaError)) {
        return (new qaError()).initialize(arguments);
    } else if (arguments.length) {
        this.initialize(arguments);
    }
}

// Generic handling for services without nice IDs
qaError.id = function() {
    return qaError.id.next--;
};

qaError.id.next = -1;

_extend(qaError.prototype, {
    type: 'qaError',

    // All errors need a position
    loc: [0, 0],

    // These should be passed in, used to retrieve from qa_errors.json
    service: '',
    error_type: '',

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

        if (this.service) {
            this.source = services[this.service].shortName;

            if (this.error_type) {
                var template = services[this.service].errorTypes[this.error_type];

                this.icon = template.icon;
                this.category = template.category;
            }
        }

        // All errors must have an ID for selection
        if (!this.id) {
            this.id = qaError.id() + '';  // as string
        }

        return this;
    },

    update: function(attrs) {
        return qaError(this, attrs); // {v: 1 + (this.v || 0)}
    }
});