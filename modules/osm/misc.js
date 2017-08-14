import { Node } from './node';
import { Way } from './way';
import { Relation } from './relation';

export function isInstanceOfEntity(target) {
    return (
        target instanceof Node ||
        target instanceof Way ||
        target instanceof Relation
    );
}

export function isInstanceOfNode(target) {
    return target instanceof Node;
}

export function isInstanceOfWay(target) {
    return target instanceof Way;
}

export function isInstanceOfRelation(target) {
    return target instanceof Relation;
}
