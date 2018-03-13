// import _some from 'lodash-es/some';

import { t } from '../util/locale';
import { behaviorOperation } from '../behavior/index';
import {createLineSegment,deleteLines,actionFillInfo,actionMerge,actionMomentaStraighten
,actionConvertLineType
,actionConvertDirection
,createAddMorePoints} from '../momenta/actions';
import {operationDelete} from '../operations';
import _uniq from 'lodash-es/uniq';


function operationMomentaDelete(selectedIDs, context) {
    var  action = deleteLines(selectedIDs, context);
    var operation = function() {
        context.perform(action, operation.annotation());
    };
    var actDel = operationDelete(selectedIDs,context);
    function checkIsAllLine(selectedIDs, context) {
        var isAllLine = true,noEle = true;
        selectedIDs.forEach(function (item, i) {
            if (context.entity(item).type !== 'way') {
                isAllLine = false;
            }
        })
        return isAllLine;
    }
    operation.available = function() {
        return true;
        var isAllLine = checkIsAllLine(selectedIDs, context);
        return isAllLine;
    };


    operation.disabled = function() {
        return ''
        return actDel.disabled();
        // var reason;
        // // if (!checkIsAllLine(selectedIDs,context)){
        // //     reason = t('operations.momenta_delete.reason');
        // // }
        // return reason;
    };


    operation.tooltip = function() {
        // var disable = operation.disabled();
        return t('operations.momenta_delete.tooltip');
    };


    operation.annotation = function() {
        return t('operations.momenta_delete.annotation');
    };


    operation.id = 'momenta_delete';
    operation.keys = [t('operations.momenta_delete.key')];
    operation.title = t('operations.momenta_delete.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}

function operationMomentaMerge(selectedIDs, context) {
    var  action = actionMerge(selectedIDs, context);
    var operation = function() {
        context.perform(action, operation.annotation());
    };
    function checkIsAllLine(selectedIDs, context) {
        var isAllLine = true,noEle = true;
        selectedIDs.forEach(function (item, i) {
            if (context.entity(item).type !== 'way') {
                isAllLine = false;
            }
        })
        return isAllLine;
    }
    operation.available = function() {
        return true;
    };


    operation.disabled = function(){
        var reason;
        // if (!checkIsAllLine(selectedIDs,context)){
        //     reason = t('operations.momenta_delete.reason');
        // }
        return reason;
    };


    operation.tooltip = function() {
        // var disable = operation.disabled();
        return t('operations.momenta_merge.tooltip');
    };


    operation.annotation = function() {
        return t('operations.momenta_merge.annotation');
    };


    operation.id = 'momenta_merge';
    operation.keys = [t('operations.momenta_merge.key')];
    operation.title = t('operations.momenta_merge.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}

function operationMomentaCreateSegment(selectedIDs, context) {
    var  action = createLineSegment(selectedIDs, context);
    // let message = convert2JSON(selectedIDs,context);
    // console.log(message);
    function checkAllLinehasEle(selectedIDs, context) {
        var noEle = false;
        selectedIDs.forEach(function (item, i) {
            var entity1 = context.entity(item);
            if (entity1.type === 'way') {
                var nodes = entity1.nodes;
                nodes.forEach(function (item2, index) {
                   if (context.entity(item2).tags.ele==null){
                       noEle = true;
                   }
                });
            }
        })
        return !noEle;
    }
    var operation = function() {
        context.perform(action, operation.annotation());
    };

    operation.available = function() {
        return true;
    };


    operation.disabled = function() {
        var reason;
        if (!checkAllLinehasEle(selectedIDs,context)){
            reason = t('operations.momenta_segment.reason');
        }
        return reason;
    };


    operation.tooltip = function() {
        return t('operations.momenta_segment.description');
    };


    operation.annotation = function() {
        return t('operations.momenta_segment.annotation');
    };


    operation.id = 'momenta_segment';
    operation.keys = [t('operations.momenta_segment.key')];
    operation.title = t('operations.momenta_segment.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}

function operationMomentaFillInfo(selectedIDs, context) {
    var  action = actionFillInfo(selectedIDs, context);

    var operation = function() {
        context.perform(action, operation.annotation());
    };
    function checkIsAllNode(selectedIDs, context) {
        var isAllLine = true,noEle = true;
        selectedIDs.forEach(function (item, i) {
            if (context.entity(item).type !== 'node') {
                isAllLine = false;
            } else if (context.entity(item).tags.ele !=null){
                noEle = false;
            }
        })
        return !noEle;
    }

    operation.available = function() {
        return true;
    };


    operation.disabled = function() {
        var reason;
        if (!checkIsAllNode(selectedIDs,context)){
            reason = t('operations.momenta_fillInfo.reason');
        }
        return reason;
    };


    operation.tooltip = function() {
        return t('operations.momenta_fillInfo.tooltip');
    };


    operation.annotation = function() {
        return t('operations.momenta_fillInfo.annotation');
    };


    operation.id = 'momenta_fillInfo';
    operation.keys = [t('operations.momenta_fillInfo.key')];
    operation.title = t('operations.momenta_fillInfo.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}

function operationMomentaStraighten(selectedIDs, context) {
    var entityId = selectedIDs[0],
        action = actionMomentaStraighten(selectedIDs,context);


    function operation() {
        context.perform(action, operation.annotation());
    }


    operation.available = function() {
        var entity = context.entity(entityId);
        return selectedIDs.length === 1 &&
            entity.type === 'way' &&
            !entity.isClosed() &&
            _uniq(entity.nodes).length > 2;
    };


    operation.disabled = function() {
        var reason;
        if (context.hasHiddenConnections(entityId)) {
            reason = 'connected_to_hidden';
        }
        return reason;
    };


    operation.tooltip = function() {
        var disable = operation.disabled();
        return disable ?
            t('operations.momenta_straighten.' + disable) :
            t('operations.momenta_straighten.description');
    };


    operation.annotation = function() {
        return t('operations.momenta_straighten.annotation');
    };


    operation.id = 'momenta_straighten';
    operation.keys = [t('operations.momenta_straighten.key')];
    operation.title = t('operations.momenta_straighten.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}


function operationMomentaAddPoints(selectedIDs, context) {
    var  action = createAddMorePoints(selectedIDs, context);

    var operation = function() {
        context.perform(action, operation.annotation());
    };
    // function checkIsAllNode(selectedIDs, context) {
    //     var isAllLine = true,noEle = true;
    //     selectedIDs.forEach(function (item, i) {
    //         if (context.entity(item).type !== 'node') {
    //             isAllLine = false;
    //         } else if (context.entity(item).tags.ele !=null){
    //             noEle = false;
    //         }
    //     })
    //     return !noEle;
    // }

    operation.available = function() {
        return true;
    };


    operation.disabled = function() {
        var reason;
        // if (!checkIsAllNode(selectedIDs,context)){
        //     reason = t('operations.momenta_addpoints.reason');
        // }
        return reason;
    };


    operation.tooltip = function() {
        return t('operations.momenta_addpoints.tooltip');
    };


    operation.annotation = function() {
        return t('operations.momenta_addpoints.annotation');
    };


    operation.id = 'momenta_addpoints';
    operation.keys = [t('operations.momenta_addpoints.key')];
    operation.title = t('operations.momenta_addpoints.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}


function operationMomentaConvertDirection(selectedIDs, context) {
    var  action = actionConvertDirection(selectedIDs, context);

    var operation = function() {
        context.perform(action, operation.annotation());
    };
    // function checkIsAllNode(selectedIDs, context) {
    //     var isAllLine = true,noEle = true;
    //     selectedIDs.forEach(function (item, i) {
    //         if (context.entity(item).type !== 'node') {
    //             isAllLine = false;
    //         } else if (context.entity(item).tags.ele !=null){
    //             noEle = false;
    //         }
    //     })
    //     return !noEle;
    // }

    operation.available = function() {
        return true;
    };


    operation.disabled = function() {
        var reason;
        // if (!checkIsAllNode(selectedIDs,context)){
        //     reason = t('operations.momenta_addpoints.reason');
        // }
        return reason;
    };


    operation.tooltip = function() {
        return t('operations.momenta_convertDirection.tooltip');
    };


    operation.annotation = function() {
        return t('operations.momenta_convertDirection.annotation');
    };


    operation.id = 'momenta_convertDirection';
    operation.keys = [t('operations.momenta_convertDirection.key')];
    operation.title = t('operations.momenta_convertDirection.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}


function operationMomentaConvertLineType(selectedIDs, context) {
    var  action = actionConvertLineType(selectedIDs, context);

    var operation = function() {
        context.perform(action, operation.annotation());
    };
    // function checkIsAllNode(selectedIDs, context) {
    //     var isAllLine = true,noEle = true;
    //     selectedIDs.forEach(function (item, i) {
    //         if (context.entity(item).type !== 'node') {
    //             isAllLine = false;
    //         } else if (context.entity(item).tags.ele !=null){
    //             noEle = false;
    //         }
    //     })
    //     return !noEle;
    // }

    operation.available = function() {
        return true;
    };


    operation.disabled = function() {
        var reason;
        // if (!checkIsAllNode(selectedIDs,context)){
        //     reason = t('operations.momenta_addpoints.reason');
        // }
        return reason;
    };


    operation.tooltip = function() {
        return t('operations.momenta_convertLineType.tooltip');
    };


    operation.annotation = function() {
        return t('operations.momenta_convertLineType.annotation');
    };


    operation.id = 'momenta_convertLineType';
    operation.keys = [t('operations.momenta_convertLineType.key')];
    operation.title = t('operations.momenta_convertLineType.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}

export {operationMomentaCreateSegment,operationMomentaDelete,operationMomentaFillInfo,operationMomentaConvertDirection,operationMomentaMerge
    ,operationMomentaConvertLineType,operationMomentaStraighten,operationMomentaAddPoints};
