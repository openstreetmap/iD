describe('iD.Indoor', function() {
    var context,
        features,
        indoor;

    beforeEach(function() {
        context = iD();
        context.map().zoom(17);
        features = context.features();
        indoor = context.indoor();

        //mocks
        var surface = d3.select(document.createElement('svg'));
        context.surface = function () {
            return surface;
        };

        var container = d3.select(document.createElement('div'));
        context.container = function () {
            return container;
        };

    });

    describe('startup', function () {
        it('returns correct level', function () {
            indoor.level('134');
            expect(indoor.level()).to.equal('134');
        });

        it('add correct classes', function () {
            indoor.level('1');
            expect(context.surface().classed('indoor-mode'), 'surface to have class .indoor-mode').to.be.true;
        });

        it('disables feature indoor_different_level', function () {
            indoor.level('1');
            expect(features.enabled('indoor_different_level'), 'indoor level ').to.be.false;
        });



    });

    describe('filtering', function () {

        it('hides features on different level', function () {

            var node1 = iD.Node({tags: {amenity: 'bar', level: '1-2'}, version: 1});
            var node2 = iD.Node({tags: {amenity: 'bar', level: '-2--1'}, version: 1});
            var node3 = iD.Node({tags: {amenity: 'bar', level: '-2-4'}, version: 1});
            var node4 = iD.Node({tags: {amenity: 'bar'}, version: 1});
            var node5 = iD.Node({tags: {amenity: 'bar', level: 'asdf'}, version: 1});
            var node6 = iD.Node({tags: {amenity: 'bar', level: '3;4;1'}, version: 1});

            var graph = iD.Graph([node1, node2, node3, node4, node5, node6]);

            // correct _hidden
            var all = _.values(graph.base().entities),
                dimensions = [1000, 1000];
            features.gatherStats(all, graph, dimensions);


            indoor.level('1');
            expect(features.isHidden(node1, graph, node1.geometry(graph)), 'level=1-2 is shown in level 1').to.be.false;
            expect(features.isHidden(node2, graph, node2.geometry(graph)), 'level=-2--1 is hidden in level 1').to.be.true;
            expect(features.isHidden(node3, graph, node3.geometry(graph)), 'level=-2-4 is shown in level 1').to.be.false;
            expect(features.isHidden(node4, graph, node4.geometry(graph)), '`no level` is hidden in level 1').to.be.true;
            expect(features.isHidden(node5, graph, node5.geometry(graph)), 'level=asdf is hidden in level 1').to.be.true;
            expect(features.isHidden(node6, graph, node6.geometry(graph)), 'level=3;4;1 is shown in level 1').to.be.false;


            indoor.level('-1.5');
            expect(features.isHidden(node2, graph, node2.geometry(graph)), 'level=-2--1 is shown in level -1.5').to.be.false;

        });
    });

});
