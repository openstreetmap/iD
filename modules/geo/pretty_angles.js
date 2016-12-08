import { geoEuclideanDistance } from './index';

/**
 * Calculate point for "pretty angle"
 */
export function calcShiftPoint (point, nodes, isArea, context) {
	var length = isArea ? nodes.length - 1 : nodes.length,
		nextAnglePieces = 8,
		lastAnglePieces = 4,
		tolerance = 10,
		p0, p1, p2, prettyLocation;

	if (length === 0) {
		return point;
	} else if (length === 1) {
		p0 = context.projection(point);
		p1 = context.projection(context.entity(nodes[length-1]).loc);
		p2 = [p1[0]+1, p1[1]];

		prettyLocation = getPrettyLocation(p0, p1, p2, nextAnglePieces);

		return context.projection.invert(prettyLocation);
	} else {
		if (isArea) {
			var mouseP = context.projection(context.map().mouseCoordinates());

			var lastPoint = context.projection(context.entity(nodes[length-1]).loc);
			var prelastPoint = context.projection(context.entity(nodes[length-2]).loc);
			var prettyLastPoint = getPrettyLocation(mouseP, lastPoint, prelastPoint, nextAnglePieces);

			var firstPoint = context.projection(context.entity(nodes[0]).loc);
			var secondPoint = context.projection(context.entity(nodes[1]).loc);
			var prettyFirstPoint = getPrettyLocation(mouseP, firstPoint, secondPoint, lastAnglePieces);

			var crossPoint = getCrossPoint([firstPoint, prettyFirstPoint], [lastPoint, prettyLastPoint]);

			if (crossPoint === null) {
				return context.projection.invert(prettyLastPoint);
			} else {
				var dist = geoEuclideanDistance(mouseP, crossPoint);
				return context.projection.invert(dist < tolerance ? crossPoint : prettyLastPoint);
			}
		} else {
			p0 = context.projection(point);
			p1 = context.projection(context.entity(nodes[length-1]).loc);
			p2 = context.projection(context.entity(nodes[length-2]).loc);
			prettyLocation = getPrettyLocation(p0, p1, p2, nextAnglePieces);

			return context.projection.invert(prettyLocation);
		}
	}
}

/**
 * Returns an Angle of line [p2, p1] relative OX in range [0; 2*pi)
 *
 * @param {Array} p1
 * @param {Array} p2
 * @returns {Number}
 */
function calcAngle(p1, p2) {
	return Math.atan2(p2[1]-p1[1], p2[0]-p1[0]) + Math.PI;
}

/**
 * Moves points to/from relative point
 *
 * @param {Array} sourceList Points to move
 * @param {Array} point      A relative point
 * @param {Boolean} reverse  Is reverse move
 */
function moveCoords(sourceList, point, reverse) {
	var r = reverse ? -1 : 1;
	sourceList.forEach(function (src) {
		src[0] -= r*point[0];
		src[1] -= r*point[1];
	});
}

/**
 * Rotates points by relative angle
 *
 * @param sourceList A points to rotate
 * @param angle      A relative angle
 * @param reverse    Is reverse rotate
 */
function rotateCoords(sourceList, angle, reverse) {
	if (!reverse) {
		angle *= -1;
	}
	var sinA = Math.sin(angle),
		cosA = Math.cos(angle);
	sourceList.forEach(function (src) {
		var x = src[0];
		var y = src[1];
		src[0] = x*cosA - y*sinA;
		src[1] = x*sinA + y*cosA;
	});
}

/**
 * Returns better location for p0 to make an angle (p2, p1, p0) pretty
 *
 * @param {Array} p0          Current cursor position
 * @param {Array} p1          Last point
 * @param {Array} p2          Prelast point
 * @param {Number} cakePieces A number of triangles, divides the plane (i.e. if cakePieces=4, then pretty angle will be multiple to 360°/4 = 90°)
 * @returns {Array}
 */
function getPrettyLocation(p0, p1, p2, cakePieces) {

	var point = p0.slice(0);

	var alpha = calcAngle(p1, p2);

	//move and rotate (1*)
	moveCoords([point], p1);
	rotateCoords([point], alpha);

	//choose nearest angle
	var currentAngle = calcAngle([0,0], point);
	var sepAngle = 2 * Math.PI / cakePieces;
	var nearestAngle = Math.round(currentAngle / sepAngle) * sepAngle;

	//rotate (2*)
	rotateCoords([point], nearestAngle);

	point[1] = 0;

	//rotate back (2*)
	rotateCoords([point], nearestAngle, true);

	//rotate and move back (1*)
	rotateCoords([point], alpha, true);
	moveCoords([point], p1, true);

	return point;
}

/**
 * Returns cross point of two lines if possible, else null
 *
 * @param {Array} line1
 * @param {Array} line2
 * @returns {Array}
 */
function getCrossPoint(line1, line2) {
	var a1 = line1[0].slice(0),
		a2 = line1[1].slice(0),
		b1 = line2[0].slice(0),
		b2 = line2[1].slice(0);

	var alpha = calcAngle(a1, a2);

	moveCoords([b1, b2], a2);
	rotateCoords([b1, b2], alpha);

	if (b1[1] === b2[1])
		return null;

	var x;
	if (b1[0] === b2[0]) {
		x = b1[0] + b1[1];
	} else {
		x = b1[0] + (b1[1] / Math.tan(-calcAngle(b1, b2)));
	}

	var point = [x, 0];
	rotateCoords([point], alpha, true);
	moveCoords([point], a2, true);

	return point;
}
