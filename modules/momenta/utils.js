import { JXON } from '../util/jxon';
import { osmChangeset } from '../osm';
import {minAjax} from './minAjax';

function addEntity(changes,entity) {
    // entity.type === entity.type;
    if (entity.changeset){
        changes.modified.push(entity);
        // if (entity.type === 'way'){
        //     changes.way.modified.push(entity);
        // } else {
        //     changes.node.modified.push(entity);
        // }
    } else {
        changes.created.push(entity);
        // if (entity.type === 'way'){
        //     changes.way.created.push(entity);
        // } else {
        //     changes.node.created.push(entity);
        // }
    }
}
function convert2JSON(selects, context) {
    //osmchange
    var i=0,graph = context.graph();
    var length = selects.length;
    // var changes = {
    //     node:{created:[],modified:[],deleted:[]},
    //     way:{created:[],modified:[],deleted:[]},
    //     relation:{created:[],modified:[],deleted:[]}
    // }
    var changes = {created:[],modified:[],deleted:[]};
    // var nodeChanges = {created:[],modified:[],deleted:[]};
    // var wayChanges = {created:[],modified:[],deleted:[]};
    // todo check node ele 高程，没有的话需要特殊处理
    for (i=0; i<length; i++) {
        var id = selects[i];
        var entity = context.entity(id);
        addEntity(changes,entity);
        if (entity.type === 'way'){
            var nodes = entity.nodes;
            nodes.forEach(function (item, index) {
                addEntity(changes,context.entity(item));
            });
        }
    }
    return JSON.stringify(changes);
}
function checkNumUseful(value) {
    return parseFloat(value)!==NaN
}
function sendPost(url,data) {
    var result = minAjax({
        url: url,//request URL
        type: 'POST',//Request type GET/POST
        //Send Data in form of GET/POST
        data: data,
        method:false,
        //CALLBACK FUNCTION with RESPONSE as argument
        success: function (data) {
            // alert(data);
            result = data;
        }
    });
    return result;
}

export {
    convert2JSON,sendPost
};

/**
 {"id":"w564936147",
 "visible":true,
 "version":"1",
 "changeset":"56745558",
 "timestamp":"2018-02-28T07:09:37Z",
 "user":"haoyiping","uid":"7442015","
 tags":{"momenta":"dash"},
 "nodes":["n5442082360","n5442082363"],
 "v":2}
 */