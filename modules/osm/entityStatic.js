export var Entity = {};

Entity.id = function(type) {
    return Entity.id.fromOSM(type, Entity.id.next[type]--);
};

Entity.id.next = {
    changeset: -1,
    node: -1,
    way: -1,
    relation: -1
};

Entity.id.fromOSM = function(type, id) {
    return type[0] + id;
};

Entity.id.toOSM = function(id) {
    return id.slice(1);
};

Entity.id.type = function(id) {
    return { c: 'changeset', n: 'node', w: 'way', r: 'relation' }[id[0]];
};

// A function suitable for use as the second argument to d3.selection#data().
Entity.key = function(entity) {
    return entity.id + 'v' + (entity.v || 0);
};
