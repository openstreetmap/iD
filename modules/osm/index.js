export { osmChangeset } from './changeset';
export { osmNode } from './node';
export { osmRelation } from './relation';
export { osmWay } from './way';
export { osmIntersection, osmTurn, osmInferRestriction } from './intersection';
export { osmLanes } from './lanes';
export {
    osmIsSimpleMultipolygonOuterMember,
    osmSimpleMultipolygonOuterMember,
    osmJoinWays
} from './multipolygon';
export { osmOneWayTags, osmPavedTags, osmIsInterestingTag } from './tags';

export { osmEntityFactory } from './entityFactory';

// DEPRECATION, use osmEntityFactory instead.
export { legacyOsmEntity as osmEntity } from './entityFactory';

export { osmUtil } from './util';

import { osmNode } from './node';
import { osmRelation } from './relation';
import { osmWay } from './way';
import { osmChangeset } from './changeset';

export function osmIsEntity(target) {
    return target instanceof osmNode 
        || target instanceof osmRelation 
        || target instanceof osmWay
        || target instanceof osmChangeset;
}

