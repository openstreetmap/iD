export type OsmType = 'node' | 'way' | 'relation';
/**
 * Combined internal representation of the OSM type and OSM id of an entity.
 */
export type EntityId = string;

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

    fromOSM(type: OsmType, id: number): EntityId {
        return type[0] + id;
    }

    toOSM(id: EntityId): number {
        var match = id.match(/^[cnwr](-?\d+)$/);
        if (match) {
            return +match[1];
        }
        return NaN;
    }

    type(id: EntityId): OsmType {
        return <OsmType>(
            { c: 'changeset', n: 'node', w: 'way', r: 'relation' }[id[0]]
        );
    }

    key(entity: iD.OsmEntity): string {
        return entity.id + 'v' + (entity.v || 0);
    }

    newId(type: OsmType): EntityId {
        return this.fromOSM(type, this.next[type]--);
    }
}

export const osmIdManager = new OsmIdManager();
