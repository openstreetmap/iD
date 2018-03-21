import {
    convert2JSON,sendPost
} from './utils';
import {url} from './url';
import {actionAddEntity,actionDeleteNode,actionDeleteWay,actionCopyEntities} from '../actions';
import {osmNode,osmWay,osmRelation} from '../osm';

function createEntity(ele,type){
    if (ele.type==='node'||type === 'node'){
        delete ele.type;
        return new osmNode(ele);
    }
    if (ele.type === 'way'||type === 'way'){
        delete ele.type;
        return new osmWay(ele);
    }

}
function deleteLines(selectIds,context) {
    // var data = convert2JSON(selectIds,context);
    return function deleteLine(graph){
        selectIds.forEach(function (item,i) {
            if (item.indexOf('n')>-1){
                graph = actionDeleteNode(item)(graph);
            }
            if (item.indexOf('w')>-1){
                var ele = context.entity(item);
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
                    sumValue += parseFloat(ele.tags.ele);
                    sumSize++;
                }
            }
        });
        var eleValue = sumValue/sumSize;
        selectIds.forEach(function (item,i) {
            var ele = context.entity(item);
            if (ele.type === 'node'){
                if (ele.tags.ele == null){
                    ele.tags.ele = ''+eleValue;
                    graph = actionAddEntity(ele)(graph);
                }
            }
            if (ele.type === 'way'){
                var nodes = ele.nodes;
                nodes.forEach(function (it1) {
                    var n = context.entity(it1);
                    n.tags.ele = ''+eleValue;
                    graph = actionAddEntity(n)(graph);
                });
                // if (ele.tags.ele == null){
                //     ele.tags.ele = eleValue;
                //     graph = actionAddEntity(ele)(graph);
                // }
            }
        });
        return graph;
    };
}
function createLineSegment(selectIds,context) {
    var data = convert2JSON(selectIds,context);
    return function createLineSegmentAction(graph) {
        var result = sendPost(url.host+url.createSeg,{value:data,type:'new'});
        result = JSON.parse(result);
        var deleteEles = result.deleted;
        var createEles = result.created;
        var modifyEles = result.modified;//暂时没有modify
        var i=0,entity;
        for (i=0; i<deleteEles.length; i++){
            var ele = deleteEles[i];
            if (ele.id.indexOf('n')>-1){
                var node = graph.entity(ele.id);
                var parentWays = graph.parentWays(node);
                if (parentWays.length<=0){
                    graph = actionDeleteNode(ele.id)(graph);
                }
            }
            if (ele.id.indexOf('w')>-1){
                graph = actionDeleteWay(ele.id)(graph);
            }
        }
        for (i=0; i<createEles.length; i++){

            var ele2 = createEles[i];
            if (ele2.nodes!=null){
                var ids = [];
                var nodes = ele2.nodes;
                for (var i1=0; i1<nodes.length; i1++){
                    var node1 = nodes[i1];
                    var nod = createEntity(node1,'node');
                    ids.push(nod.id);
                    graph = actionAddEntity(nod)(graph);
                }
                ele2.nodes = ids;
                var way = createEntity(ele2,'way');
                graph = actionAddEntity(way)(graph);
            } else {
                graph = actionAddEntity(createEntity(ele2,'way'))(graph);
            }
            // entity = createEntity(ele2);
            // graph = actionAddEntity(entity)(graph);
        }
        for (i=0; i<modifyEles.length; i++){
            entity = createEntity(modifyEles[i]);

            graph = actionAddEntity(entity)(graph);
        }
        return graph;
    };
}

function createAddMorePoints(selectIds,context) {
    var data = convert2JSON(selectIds,context);
    return function createAdd(graph) {
        var result = sendPost(url.host+url.createSeg,{value:data,type:'addpoints'});
        result = JSON.parse(result);
        var deleteEles = result.deleted;
        var createEles = result.created;
        var modifyEles = result.modified;//暂时没有modify
        var i=0,entity;
        for (i=0; i<deleteEles.length; i++){
            var ele = deleteEles[i];
            if (ele.id.indexOf('n')>-1){
                graph = actionDeleteNode(ele.id)(graph);
            }
            if (ele.id.indexOf('w')>-1){
                graph = actionDeleteWay(ele.id)(graph);
            }
        }
        for (i=0; i<createEles.length; i++){

            var ele2 = createEles[i];
            if (ele2.nodes!=null){
                var ids = [];
                var nodes = ele2.nodes;
                for (var i1=0; i1<nodes.length; i1++){
                    var node = nodes[i1];
                    var nod = createEntity(node,'node');
                    ids.push(nod.id);
                    graph = actionAddEntity(nod)(graph);
                }
                ele2.nodes = ids;
                var way = createEntity(ele2,'way');
                graph = actionAddEntity(way)(graph);
            } else {
                graph = actionAddEntity(createEntity(ele2,'way'))(graph);
            }
            // entity = createEntity(ele2);
            // graph = actionAddEntity(entity)(graph);
        }
        for (i=0; i<modifyEles.length; i++){
            entity = createEntity(modifyEles[i]);

            graph = actionAddEntity(entity)(graph);
        }
        return graph;
    };
}

function actionMerge(selectIds,context) {
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

function actionMomentaStraighten(selectIds, context) {
    var data = convert2JSON(selectIds,context);
    return function createLineSegmentAction(graph) {
        var result = sendPost(url.host+url.createSeg,{value:data,type:'straighten'});
        result = JSON.parse(result);
        var deleteEles = result.deleted;
        var createEles = result.created;
        var modifyEles = result.modified;//暂时没有modify
        var i=0,entity;
        for (i=0; i<deleteEles.length; i++){
            var ele = deleteEles[i];
            if (ele.id.indexOf('n')>-1){
                graph = actionDeleteNode(ele.id)(graph);
            }
            if (ele.id.indexOf('w')>-1){
                graph = actionDeleteWay(ele.id)(graph);
            }
        }
        for (i=0; i<createEles.length; i++){

            var ele2 = createEles[i];
            if (ele2.nodes!=null){
                var ids = [];
                var nodes = ele2.nodes;
                for (var i1=0; i1<nodes.length; i1++){
                    var node = nodes[i1];
                    var nod = createEntity(node,'node');
                    ids.push(nod.id);
                    graph = actionAddEntity(nod)(graph);
                }
                ele2.nodes = ids;
                var way = createEntity(ele2,'way');
                graph = actionAddEntity(way)(graph);
            } else {
                graph = actionAddEntity(createEntity(ele2,'way'))(graph);
            }
            // entity = createEntity(ele2);
            // graph = actionAddEntity(entity)(graph);
        }
        for (i=0; i<modifyEles.length; i++){
            entity = createEntity(modifyEles[i]);

            graph = actionAddEntity(entity)(graph);
        }
        return graph;
    };
}

function actionConvertDirection(selectIds, context) {
    var data = convert2JSON(selectIds,context);
    return function createLineSegmentAction(graph) {
        var result = sendPost(url.host+url.createSeg,{value:data,type:'convertDirection'});
        result = JSON.parse(result);
        var deleteEles = result.deleted;
        var createEles = result.created;
        var modifyEles = result.modified;//暂时没有modify
        var i=0,entity;
        for (i=0; i<deleteEles.length; i++){
            var ele = deleteEles[i];
            if (ele.id.indexOf('n')>-1){
                graph = actionDeleteNode(ele.id)(graph);
            }
            if (ele.id.indexOf('w')>-1){
                graph = actionDeleteWay(ele.id)(graph);
            }
        }
        for (i=0; i<createEles.length; i++){

            var ele2 = createEles[i];
            if (ele2.nodes!=null){
                var ids = [];
                var nodes = ele2.nodes;
                for (var i1=0; i1<nodes.length; i1++){
                    var node = nodes[i1];
                    var nod = createEntity(node,'node');
                    ids.push(nod.id);
                    graph = actionAddEntity(nod)(graph);
                }
                ele2.nodes = ids;
                var way = createEntity(ele2,'way');
                graph = actionAddEntity(way)(graph);
            } else {
                graph = actionAddEntity(createEntity(ele2,'way'))(graph);
            }
            // entity = createEntity(ele2);
            // graph = actionAddEntity(entity)(graph);
        }
        for (i=0; i<modifyEles.length; i++){
            entity = createEntity(modifyEles[i]);

            graph = actionAddEntity(entity)(graph);
        }
        return graph;
    };
}


function actionConvertLineType(selectIds, context) {
    // var data = convert2JSON(selectIds,context);

    return function convertLineType(graph){
        var copies = {};
        selectIds.forEach(function (item,i) {
            var ele = context.entity(item);
            if (ele.type === 'way'){
                graph.entity(ele.id).copy(graph, copies);
                if (ele.tags.type === 'dashed'){
                    copies[ele.id].tags.highway = 'lane-white-solid';
                    copies[ele.id].tags.type = 'solid';
                } else if (ele.tags.type === 'solid'){
                    copies[ele.id].tags.highway = 'lane-white-dash';
                    copies[ele.id].tags.type = 'dashed';
                }
                actionDeleteWay(ele.id);
                actionAddEntity(copies[ele.id]);
            }
        });


        return graph;
    };

}
function actionAddStopLine(selectIds, context) {
    // var data = convert2JSON(selectIds,context);

    return function convertLineType(graph){
        var copies = {};
        selectIds.forEach(function (item,i) {
            var ele = context.entity(item);
            if (ele.type === 'way'){
                graph.entity(ele.id).copy(graph, copies);
                copies[ele.id].tags.highway = 'lane-white-solid';
                copies[ele.id].tags.type = 'solid';
                copies[ele.id].tags.tableInfo = 'lane_lines';
                copies[ele.id].tags.merge_count = 1;

                // if (ele.tags.type === 'dashed'){
                //     copies[ele.id].tags.highway = 'lane-white-solid';
                //     copies[ele.id].tags.type = 'solid';
                // }else if (ele.tags.type === 'solid'){
                //     copies[ele.id].tags.highway = 'lane-white-dash';
                //     copies[ele.id].tags.type = 'dashed';
                // }
                actionDeleteWay(ele.id);
                actionAddEntity(copies[ele.id]);
            }
        });


        return graph;
    };

}

function addPackage(packageId) {
    return function clearAll(graph) {
        // var graph = context.graph();

        function deleteElement(entities) {
            for (var ele in entities) {
                // if (ele.indexOf('n')>-1){
                //     graph = actionDeleteNode(ele)(graph);
                // }
                if (ele.indexOf('w')>-1){
                    var entity = entities[ele];
                    if (entity){
                        graph = actionDeleteWay(ele)(graph);
                        for (var ndindex in entity.nodes){
                            graph = actionDeleteNode(entity.nodes[ndindex])(graph);
                        }
                    }
                }
            }
        }
        var entities = graph.entities;
        deleteElement(entities);

        var result = sendPost(url.check_host,{'packageIds':packageId});
        result = JSON.parse(result);
        var createEles = result.created;

        for (var i=0; i<createEles.length; i++){

            var ele2 = createEles[i];
            if (ele2.nodes!=null){
                var ids = [];
                var nodes = ele2.nodes;
                for (var i1=0; i1<nodes.length; i1++){
                    var node1 = nodes[i1];
                    var nod = createEntity(node1,'node');
                    ids.push(nod.id);
                    graph = actionAddEntity(nod)(graph);
                }
                ele2.nodes = ids;
                var way = createEntity(ele2,'way');
                graph = actionAddEntity(way)(graph);
            } else {
                graph = actionAddEntity(createEntity(ele2,'way'))(graph);
            }
            // entity = createEntity(ele2);
            // graph = actionAddEntity(entity)(graph);
        }

        return graph;

    };

}

window.addPackages = function (packageId) {
    window.id.perform(addPackage(packageId), 'deleteAll');
};
export {createLineSegment,actionAddStopLine,deleteLines,actionFillInfo,actionMerge,actionMomentaStraighten,createAddMorePoints,actionConvertDirection,actionConvertLineType};