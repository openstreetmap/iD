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

Object.assign(osmChangeset.prototype, {

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
                    tag: Object.keys(this.tags).map(function(k) {
                        return { '@k': k, '@v': this.tags[k] };
                    }, this),
                    '@version': 0.6,
                    '@generator': 'iD'
                }
            }
        };
    },


    // Generate [osmChange](http://wiki.openstreetmap.org/wiki/OsmChange)
    // XML. Returns a string.
    osmChangeJXON: function(changes) {
        var changeset_id = this.id;

        function nest(x, order) {
            var groups = {};
            for (var i = 0; i < x.length; i++) {
                var tagName = Object.keys(x[i])[0];
                if (!groups[tagName]) groups[tagName] = [];
                groups[tagName].push(x[i][tagName]);
            }
            var ordered = {};
            order.forEach(function(o) {
                if (groups[o]) ordered[o] = groups[o];
            });
            return ordered;
        }


        // sort relations in a changeset by dependencies
        function sort(changes) {

            // find a referenced relation in the current changeset
            function resolve(item) {
                return relations.find(function(relation) {
                    return item.keyAttributes.type === 'relation'
                        && item.keyAttributes.ref === relation['@id'];
                });
            }

            // a new item is an item that has not been already processed
            function isNew(item) {
                return !sorted[ item['@id'] ] && !processing.find(function(proc) {
                    return proc['@id'] === item['@id'];
                });
            }

            var processing = [];
            var sorted = {};
            var relations = changes.relation;

            if (!relations) return changes;

            for (var i = 0; i < relations.length; i++) {
                var relation = relations[i];

                // skip relation if already sorted
                if (!sorted[relation['@id']]) {
                    processing.push(relation);
                }

                while (processing.length > 0) {
                    var next = processing[0],
                    deps = next.member.map(resolve).filter(Boolean).filter(isNew);
                    if (deps.length === 0) {
                        sorted[next['@id']] = next;
                        processing.shift();
                    } else {
                        processing = deps.concat(processing);
                    }
                }
            }

            changes.relation = Object.values(sorted);
            return changes;
        }

        function rep(entity) {
            return entity.asJXON(changeset_id);
        }

        return {
            osmChange: {
                '@version': 0.6,
                '@generator': 'iD',
                'create': sort(nest(changes.created.map(rep), ['node', 'way', 'relation'])),
                'modify': nest(changes.modified.map(rep), ['node', 'way', 'relation']),
                'delete': Object.assign(nest(changes.deleted.map(rep), ['relation', 'way', 'node']), { '@if-unused': true })
            }
        };
    },


    asGeoJSON: function() {
        return {};
    }

});
