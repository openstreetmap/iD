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
        it('accurate reports zoom level', function() {
            expect(map.setZoom(4)).toEqual(map);
            expect(map.getZoom()).toEqual(4);
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
