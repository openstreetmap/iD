describe('Map', function() {
    var node, foo;

    beforeEach(function() {
        foo = document.body.appendChild(document.createElement('div'));
        foo.id = 'foo';
        map = iD.Map(d3.select('#foo').node());
    });

    afterEach(function() {
        foo.parentNode.removeChild(foo);
    });

    describe('#getZoom', function() {
        it('reports zoom level', function() {
            expect(map.setZoom(4)).toEqual(map);
            expect(map.getZoom()).toEqual(4);
        });
    });

    describe('#getCenter', function() {
        it('reports center', function() {
            expect(map.setCenter([0, 0])).toEqual(map);
            expect(map.getCenter()).toEqual([0, 0]);
            expect(map.setCenter([10, 15])).toEqual(map);
            expect(map.getCenter()[0]).toBeCloseTo(10);
            expect(map.getCenter()[1]).toBeCloseTo(15);
        });
    });

    describe('#getExtent', function() {
        it('reports extent', function() {
            expect(map.setSize([100, 100])).toEqual(map);
            expect(map.setCenter([0, 0])).toEqual(map);
            expect(map.getExtent()[0][0]).toBeCloseTo(-35.156);
            expect(map.getExtent()[1][0]).toBeCloseTo(35.156);
        });
    });

    describe('#zoomIn', function() {
        it('changes reported zoom level', function() {
            expect(map.setZoom(4)).toEqual(map);
            expect(map.getZoom()).toEqual(4);
            expect(map.zoomOut()).toEqual(map);
            expect(map.getZoom()).toEqual(3);
            expect(map.zoomIn()).toEqual(map);
            expect(map.getZoom()).toEqual(4);
        });
    });
});
