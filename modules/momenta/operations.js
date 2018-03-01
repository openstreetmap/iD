// import _some from 'lodash-es/some';

import { t } from '../util/locale';
import { behaviorOperation } from '../behavior/index';
import {createLineSegment,deleteLines,actionFillInfo} from '../momenta/actions';





function operationMomentaDeleteLine(selectedIDs, context) {
    var  action = deleteLines(selectedIDs, context);
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
        return isAllLine && !noEle;
    }
    operation.available = function() {
        var isAllLine = checkIsAllLine(selectedIDs, context);
        return isAllLine;
    };


    operation.disabled = function() {
        var reason;
        if (!checkIsAllLine(selectedIDs,context)){
            reason = t('operations.momenta_deleteLine.reason');
        }
        return reason;
    };


    operation.tooltip = function() {
        // var disable = operation.disabled();
        return t('operations.momenta_deleteLine.tooltip');
    };


    operation.annotation = function() {
        return t('operations.momenta_deleteLine.annotation');
    };


    operation.id = 'momenta_deleteLine';
    operation.keys = [t('operations.momenta_deleteLine.key')];
    operation.title = t('operations.momenta_deleteLine.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}

function operationMomentaCreateSegment(selectedIDs, context) {
    var  action = actionFillInfo(selectedIDs, context);
    // let message = convert2JSON(selectedIDs,context);
    // console.log(message);

    var operation = function() {
        context.perform(action, operation.annotation());
    };

    operation.available = function() {
        return true||selectedIDs.length > 1 ||
            context.entity(selectedIDs[0]).type !== 'node';
    };


    operation.disabled = function() {
        var reason;
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
        return isAllLine && !noEle;
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
        return t('operations.momenta_fillInfo.description');
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
export {operationMomentaCreateSegment,operationMomentaDeleteLine,operationMomentaFillInfo};
