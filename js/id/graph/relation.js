iD.Relation = iD.Entity.extend({
    type: "relation",
    members: [],

    extent: function() {
        return [[NaN, NaN], [NaN, NaN]];
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

        var outers = members.filter(function (m) { return m.role === 'outer'; }),
            inners = members.filter(function (m) { return m.role === 'inner'; });

        var result = [], current, first, last, i, how, what;

        while (outers.length) {
            current = outers.pop().nodes.slice();
            result.push([current]);

            while (outers.length && _.first(current) !== _.last(current)) {
                first = _.first(current);
                last  = _.last(current);

                for (i = 0; i < outers.length; i++) {
                    what = outers[i].nodes;

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

                outers.splice(i, 1);
                how.apply(current, what);
            }
        }

        return result;
    }
});
