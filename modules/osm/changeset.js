import _ from 'lodash';
import { osmEntity } from './entity';
import { geoExtent } from '../geo';


export function osmChangeset() {
    if (!(this instanceof osmChangeset)) {
        return (new osmChangeset()).initialize(arguments);
    } else if (arguments.length) {
        this.initialize(arguments);
    }
}


osmEntity.changeset = osmChangeset;

osmChangeset.prototype = Object.create(osmEntity.prototype);

_.extend(osmChangeset.prototype, {

    type: 'changeset',


    extent: function() {
        return new geoExtent();
    },


    geometry: function() {
        return 'changeset';
    },


    asJXON: function() {
        return {
            osm: {
                changeset: {
                    tag: _.map(this.tags, function(value, key) {
                        return { '@k': key, '@v': value };
                    }),
                    '@version': 0.6,
                    '@generator': 'iD'
                }
            }
        };
    },


    asGeoJSON: function() {
        return {};
    }

});
