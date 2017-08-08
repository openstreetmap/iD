import { Entity } from './entity';
import { Node } from './node';
import { Way } from './way';
import { Relation } from './relation';

export function osmEntity(attrs) {
    // For prototypal inheritance.
    if (this instanceof Entity) return;

    // Create the appropriate subtype.
    if (attrs && attrs.type) {
        return Entity[attrs.type].apply(this, arguments);
    } else if (attrs && attrs.id) {
        return Entity[Entity.id.type(attrs.id)].apply(this, arguments);
    }

    // Initialize a generic Entity (used only in tests).
    return new Entity().initialize(arguments);
}

export function osmNode() {
    if (!(this instanceof Node)) {
        return (new Node()).initialize(arguments);
    } else if (arguments.length) {
        this.initialize(arguments);
    }
}

export function osmFactory() {
    if (!(this instanceof Way)) {
        return (new Way()).initialize(arguments);
    } else if (arguments.length) {
        this.initialize(arguments);
    }
}

export function osmRelation() {
    if (!(this instanceof Relation)) {
        return (new Relation()).initialize(arguments);
    } else if (arguments.length) {
        this.initialize(arguments);
    }
}