import { osmNode } from './node';
import { osmWay } from './way';
import { osmRelation } from './relation';

export function isInstanceOfEntity(target) {
    return (
        target instanceof osmNode ||
        target instanceof osmWay ||
        target instanceof osmRelation
    );
}

export function isInstanceOfNode(target) {
    return target instanceof osmNode;
}

export function isInstanceOfWay(target) {
    return target instanceof osmWay;
}

export function isInstanceOfRelation(target) {
    return target instanceof osmRelation;
}
