/*
 Copyright (c) 2012, Vladimir Agafonkin
 Simplify.js is a high-performance polyline simplification library
 mourner.github.com/simplify-js
*/

(function (global, undefined) {

	"use strict";


	// to suit your point format, run search/replace for '.x' and '.y'
	// to switch to 3D, uncomment the lines in the next 2 functions
	// (configurability would draw significant performance overhead)


	function getSquareDistance(p1, p2) { // square distance between 2 points

		var dx = p1.x - p2.x,
	//	    dz = p1.z - p2.z,
		    dy = p1.y - p2.y;

		return dx * dx +
	//	       dz * dz +
		       dy * dy;
	}

	function getSquareSegmentDistance(p, p1, p2) { // square distance from a point to a segment

		var x = p1.x,
		    y = p1.y,
	//	    z = p1.z,

		    dx = p2.x - x,
		    dy = p2.y - y,
	//	    dz = p2.z - z,

		    t;

		if (dx !== 0 || dy !== 0) {

			t = ((p.x - x) * dx +
	//		     (p.z - z) * dz +
			     (p.y - y) * dy) /
			        (dx * dx +
	//		         dz * dz +
			         dy * dy);

			if (t > 1) {
				x = p2.x;
				y = p2.y;
	//			z = p2.z;

			} else if (t > 0) {
				x += dx * t;
				y += dy * t;
	//			z += dz * t;
			}
		}

		dx = p.x - x;
		dy = p.y - y;
	//	dz = p.z - z;

		return dx * dx +
	//	       dz * dz +
		       dy * dy;
	}

	// the rest of the code doesn't care for the point format


	function simplifyRadialDistance(points, sqTolerance) { // distance-based simplification

		var i,
		    len = points.length,
		    point,
		    prevPoint = points[0],
		    newPoints = [prevPoint];

		for (i = 1; i < len; i++) {
			point = points[i];

			if (getSquareDistance(point, prevPoint) > sqTolerance) {
				newPoints.push(point);
				prevPoint = point;
			}
		}

		if (prevPoint !== point) {
			newPoints.push(point);
		}

		return newPoints;
	}


	// simplification using optimized Douglas-Peucker algorithm with recursion elimination

	function simplifyDouglasPeucker(points, sqTolerance) {

		var len = points.length,

		    MarkerArray = (typeof Uint8Array !== undefined + '')
		                ? Uint8Array
		                : Array,

		    markers = new MarkerArray(len),

		    first = 0,
		    last  = len - 1,

		    i,
		    maxSqDist,
		    sqDist,
		    index,

		    firstStack = [],
		    lastStack  = [],

		    newPoints  = [];

		markers[first] = markers[last] = 1;

		while (last) {

			maxSqDist = 0;

			for (i = first + 1; i < last; i++) {
				sqDist = getSquareSegmentDistance(points[i], points[first], points[last]);

				if (sqDist > maxSqDist) {
					index = i;
					maxSqDist = sqDist;
				}
			}

			if (maxSqDist > sqTolerance) {
				markers[index] = 1;

				firstStack.push(first);
				lastStack.push(index);

				firstStack.push(index);
				lastStack.push(last);
			}

			first = firstStack.pop();
			last = lastStack.pop();
		}

		for (i = 0; i < len; i++) {
			if (markers[i]) {
				newPoints.push(points[i]);
			}
		}

		return newPoints;
	}


	var root = (typeof exports !== undefined + '')
	         ? exports
	         : global;


	root.simplify = function (points, tolerance, highestQuality) {

		var sqTolerance = (tolerance !== undefined)
		                ? tolerance * tolerance
		                : 1;

		if (!highestQuality) {
			points = simplifyRadialDistance(points, sqTolerance);
		}
		points = simplifyDouglasPeucker(points, sqTolerance);

		return points;
	};

}(this));
