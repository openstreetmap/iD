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
