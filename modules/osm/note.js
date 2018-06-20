import _extend from 'lodash-es/extend';

import { osmEntity } from './entity';
import { geoExtent } from '../geo';


export function osmNote() {
    if (!(this instanceof osmNote)) {
        return (new osmNote()).initialize(arguments);
    } else if (arguments.length) {
        this.initialize(arguments);
    }
}

osmEntity.note = osmNote;

osmNote.prototype = Object.create(osmEntity.prototype);

_extend(osmNote.prototype, {

    type: 'note',


    extent: function() {
        return new geoExtent(this.loc);
    },


    geometry: function(graph) {
        return graph.transient(this, 'geometry', function() {
            return graph.isPoi(this) ? 'point' : 'vertex';
        });
    }
});
