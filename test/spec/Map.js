describe('Map', function() {
    var container, map;

    beforeEach(function() {
        container = d3.select('body').append('div');
        map = iD.Map();
        container.call(map);
    });

    afterEach(function() {
        container.remove();
    });

    describe('#connection', function() {
        it('gets and sets connection', function() {
            var connection = {};
            expect(map.connection(connection)).to.equal(map);
            expect(map.connection()).to.equal(connection);
        });
    });

    describe('#zoom', function() {
        it('gets and sets zoom level', function() {
            expect(map.zoom(4)).to.equal(map);
            expect(map.zoom()).to.equal(4);
        });
    });

    describe('#zoomIn', function() {
        it('increments zoom', function() {
            expect(map.zoom(4)).to.equal(map);
            expect(map.zoomIn()).to.equal(map);
            expect(map.zoom()).to.equal(5);
        });
    });

    describe('#zoomOut', function() {
        it('decrements zoom', function() {
            expect(map.zoom(4)).to.equal(map);
            expect(map.zoomOut()).to.equal(map);
            expect(map.zoom()).to.equal(3);
        });
    });

    describe('#center', function() {
        it('gets and sets center', function() {
            expect(map.center([0, 0])).to.equal(map);
            expect(map.center()).to.eql([0, 0]);
            expect(map.center([10, 15])).to.equal(map);
            expect(map.center()[0]).to.be.closeTo(10, 0.5);
            expect(map.center()[1]).to.be.closeTo(15, 0.5);
        });
    });

    describe('#extent', function() {
        it('reports extent', function() {
            expect(map.size([100, 100])).to.equal(map);
            expect(map.center([0, 0])).to.equal(map);
            expect(map.extent()[0][0]).to.be.closeTo(-36, 0.5);
            expect(map.extent()[1][0]).to.be.closeTo(36, 0.5);
        });
    });

    describe("update", function () {
        var spy;

        beforeEach(function () {
            spy = sinon.spy();
            map.history({
                perform: function () {},
                undo: function () {},
                redo: function () {}
            });
            map.on('update', spy);
        });

        it("is emitted when performing an action", function () {
            map.perform(iD.actions.noop);
            expect(spy).to.have.been.called;
        });

        it("is emitted when undoing an action", function () {
            map.undo();
            expect(spy).to.have.been.called;
        });

        it("is emitted when redoing an action", function () {
            map.redo();
            expect(spy).to.have.been.called;
        });
    });

    describe("surface", function() {
        it("is an SVG element", function() {
           expect(map.surface.node().tagName).to.equal("svg");
        });
    });
});
