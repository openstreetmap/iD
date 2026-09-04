import { osmNode } from './node';
import { osmWay } from './way';
import { osmRelation } from './relation';
import { osmChangeset } from './changeset';
import type { OsmAbstractEntity } from './abstract-entity';
import { osmIdManager } from './id_manager';

const CLASSES = {
  node: osmNode,
  way: osmWay,
  relation: osmRelation,
  changeset: osmChangeset,
};


/**
 * helper function to convert a plain JSON object into the correct
 * subclass (like {@link osmNode} or {@link osmWay}).
 * This should very rarely be used.
 */
export function createEntity(
  ...attrs: Partial<OsmAbstractEntity>[]
): osmNode | osmWay | osmRelation | osmChangeset {
  // Create the appropriate subtype.
  let type = attrs[0]?.type;
  if (attrs[0]?.id) type ||= osmIdManager.type(attrs[0].id);

  if (!type) throw new Error('invalid feature');

  return new CLASSES[type](...attrs);
}
