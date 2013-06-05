// For fixing up rendering of multipolygons with tags on the outer member.
// https://github.com/systemed/iD/issues/613
iD.geo.isSimpleMultipolygonOuterMember = function(entity, graph) {
    if (entity.type !== 'way')
        return false;

    var parents = graph.parentRelations(entity);
    if (parents.length !== 1)
        return false;

    var parent = parents[0];
    if (!parent.isMultipolygon() || Object.keys(parent.tags).length > 1)
        return false;

    var members = parent.members, member;
    for (var i = 0; i < members.length; i++) {
        member = members[i];
        if (member.id === entity.id && member.role && member.role !== 'outer')
            return false; // Not outer member
        if (member.id !== entity.id && (!member.role || member.role === 'outer'))
            return false; // Not a simple multipolygon
    }

    return parent;
};

iD.geo.simpleMultipolygonOuterMember = function(entity, graph) {
    if (entity.type !== 'way')
        return false;

    var parents = graph.parentRelations(entity);
    if (parents.length !== 1)
        return false;

    var parent = parents[0];
    if (!parent.isMultipolygon() || Object.keys(parent.tags).length > 1)
        return false;

    var members = parent.members, member, outerMember;
    for (var i = 0; i < members.length; i++) {
        member = members[i];
        if (!member.role || member.role === 'outer') {
            if (outerMember)
                return false; // Not a simple multipolygon
            outerMember = member;
        }
    }

    return outerMember && graph.hasEntity(outerMember.id);
};

// Join an array of relation `members` into sequences of connecting segments.
//
// Segments which share identical start/end nodes will, as much as possible,
// be connected with each other.
//
// The return value is a nested array. Each constituent array contains elements
// of `members` which have been determined to connect. Each consitituent array
// also has a `locs` property whose value is an ordered array of member coordinates,
// with appropriate order reversal and start/end coordinate de-duplication.
//
// Incomplete members are ignored.
//
iD.geo.joinMemberWays = function(members, graph) {
    var joined = [], member, current, locs, first, last, i, how, what;

    members = members.filter(function(member) {
        return member.type === 'way' && graph.hasEntity(member.id);
    });

    function resolve(member) {
        return _.pluck(graph.childNodes(graph.entity(member.id)), 'loc');
    }

    while (members.length) {
        member = members.shift();
        current = [member];
        current.locs = locs = resolve(member);
        joined.push(current);

        while (members.length && _.first(locs) !== _.last(locs)) {
            first = _.first(locs);
            last  = _.last(locs);

            for (i = 0; i < members.length; i++) {
                member = members[i];
                what = resolve(member);

                if (last === _.first(what)) {
                    how  = locs.push;
                    what = what.slice(1);
                    break;
                } else if (last === _.last(what)) {
                    how  = locs.push;
                    what = what.slice(0, -1).reverse();
                    break;
                } else if (first === _.last(what)) {
                    how  = locs.unshift;
                    what = what.slice(0, -1);
                    break;
                } else if (first === _.first(what)) {
                    how  = locs.unshift;
                    what = what.slice(1).reverse();
                    break;
                } else {
                    what = how = null;
                }
            }

            if (!what)
                break; // No more joinable ways.

            how.apply(current, [member]);
            how.apply(locs, what);

            members.splice(i, 1);
        }
    }

    return joined;
};
