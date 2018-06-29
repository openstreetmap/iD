import _extend from 'lodash-es/extend';

import { osmEntity } from './entity';
import { geoExtent } from '../geo';

import { debug } from '../index';


export function osmNote() {
    if (!(this instanceof osmNote)) return;

    this.initialize(arguments);
    return this;
}

_extend(osmNote.prototype, {

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

        if (!this.id && this.type) {
            this.id = osmEntity.id(this.type);
        }
        if (!this.hasOwnProperty('visible')) {
            this.visible = true;
        }

        if (debug) {
            Object.freeze(this);
            Object.freeze(this.tags);

            if (this.loc) Object.freeze(this.loc);
            if (this.nodes) Object.freeze(this.nodes);
            if (this.members) Object.freeze(this.members);
        }

        return this;
    },

    extent: function() {
        return new geoExtent(this.loc);
    },

    geometry: function(graph) {
        return graph.transient(this, 'geometry', function() {
            return graph.isPoi(this) ? 'point' : 'vertex';
        });
    },

    getID: function() {
        return this.id;
    },

    getType: function() {
        return this.type;
    },

    getComments: function() {
        return this.comments;
    }
});