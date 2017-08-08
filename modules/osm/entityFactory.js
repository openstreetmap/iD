import { Entity } from './entity';
import { Node } from './node';
import { Way } from './way';
import { Relation } from './relation';

export function osmEntity(attrs) {
    // For prototypal inheritance.
    // if (this instanceof Entity) return;
    // Create the appropriate subtype.
    if (!attrs.type && !attrs.id) throw new Error('entity needs id/type')
    var type = (attrs && attrs.type) || Entity.id.type(attrs.id);
    if (type === 'node') {
        return osmNode.apply(this, arguments);
    } else if (type === 'way') {
        return osmWay.apply(this, arguments);
    } else if (type === 'relation') {
        return osmRelation.apply(this, arguments);
    }
    // Initialize a generic Entity (used only in tests).
    // return new Node().initialize(arguments);
}

export function osmNode() {
    return new Node().initialize(arguments);
}

export function osmWay() {
    return new Way().initialize(arguments);
}

export function osmRelation() {
        return new Relation().initialize(arguments);
}
