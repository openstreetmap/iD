iD.Relation = iD.Entity.extend({
    type: "relation",
    members: [],

    extent: function(resolver) {
        return resolver.transient(this, 'extent', function() {
            var extent = iD.geo.Extent();
            for (var i = 0, l = this.members.length; i < l; i++) {
                extent = extent.extend(resolver.entity(this.members[i].id).extent(resolver));
            }
            return extent;
        });
    },

    geometry: function() {
        return 'relation';
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
        var members = this.members
            .filter(function (m) { return m.type === 'way'; })
            .map(function (m) { return { role: m.role || 'outer', id: m.id, nodes: resolver.fetch(m.id).nodes }; });

        function join(ways) {
            var joined = [], current, first, last, i, how, what;

            while (ways.length) {
                current = ways.pop().nodes.slice();
                joined.push(current);

                while (ways.length && _.first(current) !== _.last(current)) {
                    first = _.first(current);
                    last  = _.last(current);

                    for (i = 0; i < ways.length; i++) {
                        what = ways[i].nodes;

                        if (last === _.first(what)) {
                            how  = current.push;
                            what = what.slice(1);
                            break;
                        } else if (last === _.last(what)) {
                            how  = current.push;
                            what = what.slice(0, -1).reverse();
                            break;
                        } else if (first == _.last(what)) {
                            how  = current.unshift;
                            what = what.slice(0, -1);
                            break;
                        } else if (first == _.first(what)) {
                            how  = current.unshift;
                            what = what.slice(1).reverse();
                            break;
                        } else {
                            what = how = null;
                        }
                    }

                    if (!what)
                        break; // Invalid geometry (unclosed ring)

                    ways.splice(i, 1);
                    how.apply(current, what);
                }
            }

            return joined;
        }

        function findOuter(inner) {
            var o, outer;

            inner = _.pluck(inner, 'loc');

            for (o = 0; o < outers.length; o++) {
                outer = _.pluck(outers[o], 'loc');
                if (iD.util.geo.polygonContainsPolygon(outer, inner))
                    return o;
            }

            for (o = 0; o < outers.length; o++) {
                outer = _.pluck(outers[o], 'loc');
                if (iD.util.geo.polygonIntersectsPolygon(outer, inner))
                    return o;
            }
        }

        var outers = join(members.filter(function (m) { return m.role === 'outer'; })),
            inners = join(members.filter(function (m) { return m.role === 'inner'; })),
            result = outers.map(function (o) { return [o]; });

        for (var i = 0; i < inners.length; i++) {
            var o = findOuter(inners[i]);
            if (o !== undefined)
                result[o].push(inners[i]);
            else
                result.push(inners[i]); // Invalid geometry
        }

        return result;
    }
});
