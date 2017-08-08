import { Entity } from './entity';
import { Node } from './node';
import { Way } from './way';
import { Relation } from './relation';

export function osmEntity(attrs) {
    // For prototypal inheritance.
    // if (this instanceof Entity) return;

    // Create the appropriate subtype.
    var type = (attrs && attrs.type) || Entity.id.type(attrs.id);
    console.log(type);
    if (type === 'node') {
        return osmNode.apply(this, arguments);
    } else if (type === 'way') {
        return osmWay.apply(this, arguments);
    } else if (type === 'relation') {
        return osmRelation.apply(this, arguments);
    }
    // Initialize a generic Entity (used only in tests).
    return new Entity().initialize(arguments);
}

export function osmNode() {
    if (arguments.length) {
        return new Node().initialize(arguments);
    }
}

export function osmWay() {
    if (arguments.length) {
        return new Way().initialize(arguments);
    }
}

export function osmRelation() {
    if (arguments.length) {
        return new Relation().initialize(arguments);
    }
}
