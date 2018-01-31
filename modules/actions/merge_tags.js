export function actionMergeTags(idsFrom, idsTo) {

    // Merge all tags from entities whose id is in idsFrom
    // into every entity whose id is in idsTo

    return function(graphFrom) {

        var graphTo = graphFrom;

        idsTo.forEach(function(idTo) {
            var entityTo = graphTo.entity(idTo);

            idsFrom.forEach(function(id) {
                var entityFrom = graphTo.entity(id);
                entityTo = entityTo.mergeTags(entityFrom.tags);
            });

            graphTo = graphTo.replace(entityTo);
        });

        return graphTo;
    };
}
