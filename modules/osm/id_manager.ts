export type FeatureType = 'node' | 'way' | 'relation';

/**
 * All newly created features need an ID, so this singleton
 * class allocates the next available ID, starting from -1
 * and decrementing.
 */
class OsmIdManager {
    next = {
        changeset: -1,
        node: -1,
        way: -1,
        relation: -1,
    };

    fromOSM(type: FeatureType, id: number) {
        return type[0] + id;
    }

    toOSM(id: string) {
        var match = id.match(/^[cnwr](-?\d+)$/);
        if (match) {
            return match[1];
        }
        return '';
    }

    type(id: string) {
        return <FeatureType>(
            { c: 'changeset', n: 'node', w: 'way', r: 'relation' }[id[0]]
        );
    }

    /** A function suitable for use as the second argument to d3.selection#data(). */
    key(entity: iD.OsmEntity) {
        return entity.id + 'v' + (entity.v || 0);
    }

    newId(type: FeatureType) {
        return this.fromOSM(type, this.next[type]--);
    }
}

export const osmIdManager = new OsmIdManager();
