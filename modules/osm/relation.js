import { geoArea as d3_geoArea } from 'd3-geo';

import { osmEntity } from './entity';
import { entityEntity } from '../entities/entity';
import { entityRelation } from '../entities/relation';
import { osmJoinWays } from './multipolygon';
import { geoPolygonContainsPolygon, geoPolygonIntersectsPolygon } from '../geo';


export function osmRelation() {
    if (!(this instanceof osmRelation)) {
        return (new osmRelation()).initialize(arguments);
    } else if (arguments.length) {
        this.initialize(arguments);
    }
}


entityEntity.relation = osmRelation;

// inhert from entityRelation
osmRelation.prototype = Object.create(entityRelation.prototype);

// Use common properties of osmEntity.
// This is not prototype inheritance. osmRelation is not an `instanceof` osmEntity.
Object.assign(osmRelation.prototype, osmEntity.prototype);

Object.assign(osmRelation.prototype, {

    isMultipolygon: function() {
        return this.tags.type === 'multipolygon';
    },

    hasFromViaTo: function() {
        return (
            this.members.some(function(m) { return m.role === 'from'; }) &&
            this.members.some(function(m) { return m.role === 'via'; }) &&
            this.members.some(function(m) { return m.role === 'to'; })
        );
    },

    isRestriction: function() {
        return !!(this.tags.type && this.tags.type.match(/^restriction:?/));
    },

    isValidRestriction: function() {
        if (!this.isRestriction()) return false;

        var froms = this.members.filter(function(m) { return m.role === 'from'; });
        var vias = this.members.filter(function(m) { return m.role === 'via'; });
        var tos = this.members.filter(function(m) { return m.role === 'to'; });

        if (froms.length !== 1 && this.tags.restriction !== 'no_entry') return false;
        if (froms.some(function(m) { return m.type !== 'way'; })) return false;

        if (tos.length !== 1 && this.tags.restriction !== 'no_exit') return false;
        if (tos.some(function(m) { return m.type !== 'way'; })) return false;

        if (vias.length === 0) return false;
        if (vias.length > 1 && vias.some(function(m) { return m.type !== 'way'; })) return false;

        return true;
    },

    // Returns an array [A0, ... An], each Ai being an array of node arrays [Nds0, ... Ndsm],
    // where Nds0 is an outer ring and subsequent Ndsi's (if any i > 0) being inner rings.
    //
    // This corresponds to the structure needed for rendering a multipolygon path using a
    // `evenodd` fill rule, as well as the structure of a GeoJSON MultiPolygon geometry.
    //
    // In the case of invalid geometries, this function will still return a result which
    // includes the nodes of all way members, but some Nds may be unclosed and some inner
    // rings not matched with the intended outer ring.
    //
    multipolygon: function(resolver) {
        var outers = this.members.filter(function(m) { return 'outer' === (m.role || 'outer'); });
        var inners = this.members.filter(function(m) { return 'inner' === m.role; });

        outers = osmJoinWays(outers, resolver);
        inners = osmJoinWays(inners, resolver);

        outers = outers.map(function(outer) {
            return outer.nodes.map(function(node) { return node.loc; });
        });
        inners = inners.map(function(inner) {
            return inner.nodes.map(function(node) { return node.loc; });
        });

        var result = outers.map(function(o) {
            // Heuristic for detecting counterclockwise winding order. Assumes
            // that OpenStreetMap polygons are not hemisphere-spanning.
            return [d3_geoArea({ type: 'Polygon', coordinates: [o] }) > 2 * Math.PI ? o.reverse() : o];
        });

        function findOuter(inner) {
            var o, outer;

            for (o = 0; o < outers.length; o++) {
                outer = outers[o];
                if (geoPolygonContainsPolygon(outer, inner))
                    return o;
            }

            for (o = 0; o < outers.length; o++) {
                outer = outers[o];
                if (geoPolygonIntersectsPolygon(outer, inner, false))
                    return o;
            }
        }

        for (var i = 0; i < inners.length; i++) {
            var inner = inners[i];

            if (d3_geoArea({ type: 'Polygon', coordinates: [inner] }) < 2 * Math.PI) {
                inner = inner.reverse();
            }

            var o = findOuter(inners[i]);
            if (o !== undefined) {
                result[o].push(inners[i]);
            } else {
                result.push([inners[i]]); // Invalid geometry
            }
        }

        return result;
    }

});
