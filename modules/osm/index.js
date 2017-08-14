export { osmChangeset } from './changeset';
export { osmEntity } from './entityFactory';
export { osmNode } from './node';
export { osmRelation } from './relation';
export { osmWay } from './way';
export { Entity as EntityStatics } from './entityStatic';
export {
    isInstanceOfEntity,
    isInstanceOfNode,
    isInstanceOfWay,
    isInstanceOfRelation
} from './misc';

export { osmIntersection, osmTurn, osmInferRestriction } from './intersection';

export { osmLanes } from './lanes';

export {
    osmIsSimpleMultipolygonOuterMember,
    osmSimpleMultipolygonOuterMember,
    osmJoinWays
} from './multipolygon';

export { osmOneWayTags, osmPavedTags, osmIsInterestingTag } from './tags';
