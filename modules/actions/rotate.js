import _ from 'lodash';
import { geoRotate } from '../geo';


export function actionRotate(wayId, pivot, angle, projection) {
    var action = function(graph) {
        return graph.update(function(graph) {
            var way = graph.entity(wayId);
            _.uniq(way.nodes).forEach(function(id) {
                var node = graph.entity(id),
                    point = geoRotate([projection(node.loc)], angle, pivot)[0];

                graph = graph.replace(node.move(projection.invert(point)));
            });
        });
    };

    return action;
}
