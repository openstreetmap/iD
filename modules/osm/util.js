var id = function(type) {
    return id.fromOSM(type, id.next[type]--);
};

id.next = {
    changeset: -1,
    node: -1,
    way: -1,
    relation: -1
};

id.fromOSM = function(type, id) {
    return type[0] + id;
};

id.toOSM = function(id) {
    return id.slice(1);
};

id.type = function(id) {
    if (!id) return;
    return { c: 'changeset', n: 'node', w: 'way', r: 'relation' }[id[0]];
};

// A function suitable for use as the second argument to d3.selection#data().
var key = function(entity) {
    return entity.id + 'v' + (entity.v || 0);
};

export var osmUtil = { id: id, key: key };