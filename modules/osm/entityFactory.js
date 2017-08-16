import { osmUtil } from './util';

import { osmNode } from './node';
import { osmWay } from './way';
import { osmRelation } from './relation';
import { osmChangeset } from './changeset';
import { osmEntity } from './entity';

export function entityFactory(attrs) {
    // For prototypal inheritance.
    // Create the appropriate subtype.
    var type = attrs && (attrs.type || osmUtil.id.type(attrs.id));
    if (type === 'node') {
        return osmNode.apply(this, arguments);
    } else if (type === 'way') {
        return osmWay.apply(this, arguments);
    } else if (type === 'relation') {
        return osmRelation.apply(this, arguments);
    } else if (type === 'changeset') {
        return osmChangeset.apply(this, arguments);
    } else {
        console.warn('DEPRECATION: creating osmEntity(), would be deprecated in future iD version.');
        return osmEntity.apply(this, arguments);
    }
}

// DEPRECATION: this will be deprecated in future iD release.
export function legacyOsmEntity() {
    return entityFactory.apply(this, arguments);
}
legacyOsmEntity.id = osmUtil.id;
legacyOsmEntity.key = osmUtil.key;
