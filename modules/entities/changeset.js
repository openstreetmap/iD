import { entityEntity } from './entity';
import { geoExtent } from '../geo';


export function entityChangeset() {
    if (!(this instanceof entityChangeset)) {
        return (new entityChangeset()).initialize(arguments);
    } else if (arguments.length) {
        this.initialize(arguments);
    }
}


entityEntity.changeset = entityChangeset;

entityChangeset.prototype = Object.create(entityEntity.prototype);

Object.assign(entityChangeset.prototype, {

    type: 'changeset',

    extent: function() {
        return new geoExtent();
    },

    geometry: function() {
        return 'changeset';
    },

    asJXON: function() {
        return {};
    },

    asGeoJSON: function() {
        return {};
    }

});
