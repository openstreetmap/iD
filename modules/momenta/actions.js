import {
    convert2JSON,sendPost
} from './utils';
import {url} from './url';
import {actionAddEntity,actionDeleteNode,actionDeleteWay} from '../actions';
import {osmNode,osmWay,osmRelation} from '../osm';
// import

function createEntity(ele){
    if (ele.type==='node'){
        delete ele.type;
        return new osmNode(ele);
    }
    if (ele.type === 'way'){
        delete ele.type;
        return new osmWay(ele);
    }
}
function deleteLines(selectIds,context) {
    // var data = convert2JSON(selectIds,context);
    return function deleteLine(graph){
        selectIds.forEach(function (item,i) {
            var ele = context.entity(item);
            if (ele.type === 'way'){
                graph = actionDeleteWay(item)(graph);
                var nodes = ele.nodes;
                nodes.forEach(function (node,index) {
                    graph = actionDeleteNode(node)(graph);
                });
            }
        });
        return graph;
    };
}
function actionFillInfo(selectIds,context) {
    return function deleteLine(graph){
        var sumValue=0.0,sumSize=0;
        selectIds.forEach(function (item,i) {
            var ele = context.entity(item);
            if (ele.type === 'node'){
                if (ele.tags.ele != null){
                    sumValue += ele.tags.ele;
                    sumSize++;
                }
            }
        });
        var eleValue = sumValue/sumSize;
        selectIds.forEach(function (item,i) {
            var ele = context.entity(item);
            if (ele.type === 'node'){
                if (ele.tags.ele == null){
                    ele.tags.ele = eleValue;
                    graph = actionAddEntity(ele)(graph);
                }
            }
        });
        return graph;
    };
}
function createLineSegment(selectIds,context) {
    var data = convert2JSON(selectIds,context);
    return function createLineSegmentAction(graph) {
        var result = sendPost(url.host+url.mergePoints,data);
        result = JSON.parse(result);
        var deleteEles = result.deleted;
        var createEles = result.created;
        var modifyEles = result.modified;//暂时没有modify
        var i=0,entity;
        for (i=0; i<deleteEles.length; i++){
            var ele = deleteEles[i];
            if (ele.type === 'node'){
               graph = actionDeleteNode(ele.id)(graph);
            }
            if (ele.type === 'way'){
                graph = actionDeleteWay(ele.id)(graph);
            }
        }
        for (i=0; i<createEles.length; i++){
            entity = createEntity(createEles[i]);
            graph = actionAddEntity(entity)(graph);
        }
        for (i=0; i<modifyEles.length; i++){
            entity = createEntity(modifyEles[i]);

            graph = actionAddEntity(entity)(graph);
        }
        return graph;
    };
}

export {createLineSegment,deleteLines,actionFillInfo};