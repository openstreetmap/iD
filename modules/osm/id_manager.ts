import type { OsmEntity } from './abstract-entity';

export type OsmType = 'changeset' | 'node' | 'way' | 'relation';
export type OsmTypeShort = 'c' | 'n' | 'w' | 'r';

/**
 * Combined internal representation of the OSM type and OSM id of an entity.
 */
export type EntityId = `${OsmTypeShort}${number}`;
export type NodeId = `n${number}`;
export type WayId = `w${number}`;
export type RelationId = `r${number}`;
export type ChangesetId = `c${number}`;
export type NoteId = number;


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
        return <EntityId>(type[0] + id);
    }

    toOSM(id: EntityId): string {
        var match = id.match(/^[cnwr](-?\d+)$/);
        if (match) {
            return match[1];
        }
        return '';
    }

    type(id: EntityId): OsmType {
        return <OsmType>(
            { c: 'changeset', n: 'node', w: 'way', r: 'relation' }[id[0]]
        );
    }

    /** A function suitable for use as the second argument to d3.selection#data(). */
    key(entity: OsmEntity): EntityId {
        return <EntityId>(entity.id + 'v' + (entity.v || 0));
    }

    newId(type: OsmType): EntityId {
        return this.fromOSM(type, this.next[type]--);
    }
}

export const osmIdManager = new OsmIdManager();
