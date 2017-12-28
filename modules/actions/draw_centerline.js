import _each from 'lodash-es/each';
import _uniq from 'lodash-es/uniq';
import _uniqWith from 'lodash-es/uniqWith';
import _without from 'lodash-es/without';
import { median as d3_median } from 'd3-array';
import {
    polygonArea as d3_polygonArea,
    polygonHull as d3_polygonHull,
    polygonCentroid as d3_polygonCentroid
} from 'd3-polygon';
import {
    geoEuclideanDistance,
    geoInterp
} from '../geo';
import { osmNode ,osmWay} from '../osm';
import {
    modeAddArea,
    modeAddLine,
    modeAddPoint,
    modeBrowse, modeDrawLine
} from '../modes';
import {actionAddEntity, actionAddVertex} from './index';

import {point as _point} from '@turf/turf';
import {tin as _tin} from '@turf/turf';
import {polygon as _polygon} from '@turf/turf';
import { multiPoint as _multiPoint } from '@turf/turf';
import { points as _points} from '@turf/turf';
import { booleanPointInPolygon as _booleanPointInPolygon} from '@turf/turf';
import { lineString as _lineString } from '@turf/turf';
import { nearestPointOnLine as _nearestPointOnLine } from '@turf/turf';
import { bezierSpline as _bezierSpline} from '@turf/turf';


export function actionDrawCenterline(wayId, projection, context, maxAngle) {
    maxAngle = (maxAngle || 20) * Math.PI / 180;
    var startGraph = context.graph();


    function vecAdd(a, b) { return [a[0] + b[0], a[1] + b[1]]; }
    function vecMid(a, b) { return [(a[0] + b[0])/2 , (a[1] + b[1])/2];}
    function vecSub(a, b) { return [a[0] - b[0], a[1] - b[1]]; }
    function vecProduct(a, b){ return a[0]*b[0] + a[1]* b[1]; }
    function vecDistance(a, b){ return (a[0]-b[0]) * (a[0]-b[0]) + (a[1]- b[1]) * (a[1]- b[1]); }

    function cloestPointonLine(p,p1,p2,sqDist) {
        var x = p1[0],
            y = p1[1],
            dx = p2[0] - x,
            dy = p2[1] - y,
            dot = dx * dx + dy * dy,
            t;

        if (dot > 0) {
            t = ((p[0] - x) * dx + (p[1] - y) * dy) / dot;

            if (t > 1) {
                x = p2[0];
                y = p2[1];
            } else if (t > 0) {
                x += dx * t;
                y += dy * t;
            }
        }
        dx = p[0] - x;
        dy = p[1] - y;

        return sqDist ? dx * dx + dy * dy : [x, y];
    }

    function calMidParMethodII(graph){
        var way1 = graph.entity(wayId[0]);
        var way2 = graph.entity(wayId[1]);
        var way1Points = _uniq(graph.childNodes(way1).map(function(n) { return projection(n.loc); }));
        var way2Points = _uniq(graph.childNodes(way2).map(function(n) { return projection(n.loc); }));
        var wayShortPoints = way1Points.length <= way2Points.length ? way1Points : way2Points;
        var wayLongPoints = way1Points.length > way2Points.length ? way1Points : way2Points;

        var mids =[];
        var longpoints = [];
        for (var i = 0; i < wayShortPoints.length; ++i){
            var mid = [];
            var distance = cloestPointonLine(wayShortPoints[i],wayLongPoints[0],wayLongPoints[1],true);
            var snapped =  cloestPointonLine(wayShortPoints[i],wayLongPoints[0],wayLongPoints[1],false);
            for (var j = 0; j < wayLongPoints.length -1; ++j) {
                var snapped1 = cloestPointonLine(wayShortPoints[i],wayLongPoints[j],wayLongPoints[j+1],false);
                var distance1 = cloestPointonLine(wayShortPoints[i],wayLongPoints[j],wayLongPoints[j+1],true);
                distance =Math.min(distance1,distance);
                snapped = distance === distance1 ? snapped1 :snapped;
                mid = vecMid(wayShortPoints[i],snapped);
            }
            mids.push(mid);
            longpoints.push(snapped);
        }

        var nodess = [],
            nodes = [];
        for (var i = 0; i < mids.length; i++) {
            nodess.push(osmNode({loc : projection.invert(longpoints[i])}));
            graph = graph.replace(nodess[i]);
        }


        for (var i = 0; i < mids.length; i++) {
            nodes.push(osmNode({loc : projection.invert(mids[i])}));
            graph = graph.replace(nodes[i]);
        }

        var way = osmWay();
        var ids = nodes.map(function(n) { return n.id; });
        graph = graph.replace(way);

        for (var i = 0; i < ids.length; ++i) {
            graph = graph.replace(graph.entity(way.id).addNode(ids[i]));
        }
        return graph;

    }

    function calMidParMethod(graph) {
        var way1 = graph.entity(wayId[0]);
        var way2 = graph.entity(wayId[1]);
        var way1Points = _uniq(graph.childNodes(way1).map(function(n) { return projection(n.loc); }));
        var way2Points = _uniq(graph.childNodes(way2).map(function(n) { return projection(n.loc); }));
        var wayShortPoints = way1Points.length <= way2Points.length ? way1Points : way2Points;
        var wayLongPoints = way1Points.length > way2Points.length ? way1Points : way2Points;
        var wayLong = _lineString(wayLongPoints);
        //wayLong = _bezierSpline(wayLong);



        var mids = [];
        var nodes = [];
        var pts = [];
        for (var i = 0; i < wayShortPoints.length; ++i) {
            var turfPoint = _point(wayShortPoints[i]);
            var pt = _nearestPointOnLine(wayLong,turfPoint);
            pts.push(pt.geometry.coordinates);
            var mid = vecMid(wayShortPoints[i],pt.geometry.coordinates);
            mids.push(mid);
        }

        var nodess = [];
        for (var i = 0; i < mids.length; i++) {
            nodess.push(osmNode({loc : projection.invert(pts[i])}));
            graph = graph.replace(nodess[i]);
        }


        for (var i = 0; i < mids.length; i++) {
            nodes.push(osmNode({loc : projection.invert(mids[i])}));
            graph = graph.replace(nodes[i]);
        }

        var way = osmWay();
        var ids = nodes.map(function(n) { return n.id; });
        graph = graph.replace(way);

        for (var i = 0; i < ids.length; ++i) {
            graph = graph.replace(graph.entity(way.id).addNode(ids[i]));
        }
        return graph;



    }

    var action = function(graph) {

        graph = calMidParMethodII(graph);

       //graph = calMidParMethod(graph);


/*
//Tin 計算中心線
        var way1 = graph.entity(wayId[0]);
        var way2 = graph.entity(wayId[1]);
        var nodesWay1 = _uniq(graph.childNodes(way1));
        var nodesWay2 = _uniq(graph.childNodes(way2));
        var way1Points = nodesWay1.map(function(n) { return projection(n.loc); });
        var way2Points = nodesWay2.map(function(n) { return projection(n.loc); });
        //Determine the start and the endpoint of the midline
        var start = vecMid (way1Points[0], way2Points[0]),
            end = vecMid (way1Points[way1Points.length - 1], way2Points[way2Points.length - 1]);
        //Determine the start and the end of the line
        var nodeStart = osmNode({loc : projection.invert(start)}),
            nodeEnd = osmNode({loc : projection.invert(end)});
        //Crete a polygon consiting of points in two ways in order to use "tin" from truf
        _each(way2Points.reverse(), function(point) {way1Points.push(point);});
        var turfPoints = _points(way1Points);
        var tin = _tin(turfPoints);
        console.log(tin);
        way1Points.push(way1Points[0]);
        var wayPolygon = _polygon([way1Points],{name:'poly1'});
        //收集tin三角形所有线段中点，判定其是否在多边形内部
        var midPoints = [];
        _each(tin.features, function(poly){
            var coordinates = poly.geometry.coordinates[0];
            for (var i = 0; i < coordinates.length - 1; ++i) {
                var midPoint = vecMid(coordinates[i],coordinates[i+1]);
                var deltaRight = [0.00001,0],
                    deltaLeft = [-0.00001,0];
                var midPointDeltaRight = vecAdd(midPoint,deltaRight),
                    midPointDeltaLeft = vecAdd(midPoint,deltaLeft);
                //push the midPoint if the midPoint in the polygon created by tin
                if (_booleanPointInPolygon(midPoint,wayPolygon) &&
                    _booleanPointInPolygon(midPointDeltaLeft,wayPolygon) &&
                    _booleanPointInPolygon(midPointDeltaRight,wayPolygon)){midPoints.push(midPoint);}
            }
        });
        function isArrayEqual(a,b) {
            return ((a[0] === b[0]) && (a[1] === b[1]));
        }
        var midPointss = _uniqWith(midPoints, isArrayEqual);

        //midPointss.sort()

        //Push All the middle point into the nodes
        var nodes = [nodeStart];
        _each(midPointss,function(point){
           nodes.push(osmNode({loc : projection.invert(point)}));
        });
        nodes.push(nodeEnd);
        _each(nodes,function(node){graph = graph.replace(node);});
        var way = osmWay();
        var ids = nodes.map(function(n) { return n.id; });
        graph = graph.replace(way);

        for (var i = 0; i < ids.length; ++i) {
            graph = graph.replace(graph.entity(way.id).addNode(ids[i]));
        }
        return graph;
*/
/*
 //两点线计算中心线
        var way1 = graph.entity(wayId[0]);
        var way2 = graph.entity(wayId[1]);
        var nodesWay1 = _uniq(graph.childNodes(way1));
        var nodesWay2 = _uniq(graph.childNodes(way2));
        var way1Points = nodesWay1.map(function(n) { return projection(n.loc); });
        var way2Points = nodesWay2.map(function(n) { return projection(n.loc); });

        var start = vecMid (way1Points[0], way2Points[0]),
            end = vecMid (way1Points[way1Points.length - 1], way2Points[way2Points.length - 1]);

        var nodeStart = osmNode({loc : projection.invert(start)}),
            nodeEnd = osmNode({loc : projection.invert(end)});

        graph = graph.replace(nodeStart);
        graph = graph.replace(nodeEnd);

        var way = osmWay();

        var nodes=[nodeStart,nodeEnd];
        var ids = nodes.map(function(n) { return n.id; });
        graph = graph.replace(way);

        _each(nodes, function(node) {
            graph = graph.replace(graph.entity(way.id).addNode(node));
        })

        for (var i = 0; i < ids.length; ++i)
        {
            graph = graph.replace(graph.entity(way.id).addNode(ids[i]));
        }
        //graph = graph.replace(graph.entity(way.id).addNode(ids[0]));
        //graph = graph.replace(graph.entity(way.id).addNode(ids[1]));
/*
        _each(way1.nodes, function(id)
        {
            var node = graph.entity(id),
                start = projection(node.loc);
            var delta = [10,0];
            var end = vecAdd(start,delta);
            var endpoint = projection.invert(end);
            var endpoint1 = node.move(endpoint);
            graph = graph.replace(node.move(projection.invert(end)));

        });
*/


        return graph;
    };


    action.makeConvex = function(graph) {
        return graph;
    };


    action.disabled = function(graph) {
        if (!graph.entity(wayId).isClosed())
            return 'not_closed';
    };


    action.transitionable = true;


    return action;
}
