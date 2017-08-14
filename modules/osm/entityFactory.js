import { Entity } from './entityStatic';
import { osmNode } from './node';
import { osmWay } from './way';
import { osmRelation } from './relation';
import { osmChangeset } from './changeset';

export function osmEntity(attrs) {
    // For prototypal inheritance.
    // Create the appropriate subtype.
    if (!attrs.type && !attrs.id) {
        throw new Error('entity needs id/type');
    }
    var type = (attrs && attrs.type) || Entity.id.type(attrs.id);
    if (type === 'node') {
        return osmNode.apply(this, arguments);
    } else if (type === 'way') {
        return osmWay.apply(this, arguments);
    } else if (type === 'relation') {
        return osmRelation.apply(this, arguments);
    } else if (type === 'changeset') {
        return osmChangeset.apply(this, arguments);
    }
}

