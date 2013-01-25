describe('iD.Map', function() {
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
            var connection = iD.Connection();
            expect(map.connection(connection)).to.equal(map);
            expect(map.connection()).to.equal(connection);
        });
    });

    describe('#zoom', function() {
        it('gets and sets zoom level', function() {
            expect(map.zoom(4)).to.equal(map);
            expect(map.zoom()).to.equal(4);
        });

        it('dispatches move event when zoom changes', function() {
            var spy = sinon.spy();
            map.zoom(4);
            map.on('move', spy);
            map.zoom(5);
            expect(spy).to.have.been.called;
        });

        it('dispatches no move event when zoom does not change', function() {
            var spy = sinon.spy();
            map.zoom(4);
            map.on('move', spy);
            map.zoom(4);
            expect(spy).not.to.have.been.called;
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

    describe('#minzoom', function() {
        it('is zero by default', function() {
            expect(map.minzoom()).to.equal(0);
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

        it('dispatches move event when center changes', function() {
            var spy = sinon.spy();
            map.center([0, 0]);
            map.on('move', spy);
            map.center([1, 1]);
            expect(spy).to.have.been.called;
        });

        it('dispatches no move event when center does not change', function() {
            var spy = sinon.spy();
            map.center([0, 0]);
            map.on('move', spy);
            map.center([0, 0]);
            expect(spy).not.to.have.been.called;
        });
    });

    describe('#centerEase', function() {
        it('sets center', function(done) {
            expect(map.center([10, 10])).to.equal(map);
            expect(map.centerEase([20, 20])).to.equal(map);
            window.setTimeout(function() {
                expect(map.center()[0]).to.be.closeTo(20, 0.5);
                expect(map.center()[1]).to.be.closeTo(20, 0.5);
                done();
            }, 1000);
        });
    });

    describe('#centerZoom', function() {
        it('gets and sets center and zoom', function() {
            expect(map.centerZoom([20, 25], 4)).to.equal(map);
            expect(map.center()[0]).to.be.closeTo(20, 0.5);
            expect(map.center()[1]).to.be.closeTo(25, 0.5);
            expect(map.zoom()).to.be.equal(4);
        });
    });

    describe('#extent', function() {
        it('gets and sets extent', function() {
            map.size([100, 100])
                .center([0, 0]);

            expect(map.extent()[0][0]).to.be.closeTo(-17.5, 0.5);
            expect(map.extent()[1][0]).to.be.closeTo(17.5, 0.5);
            expect(map.extent([[10, 1], [30, 1]]));
            expect(map.extent()[0][0]).to.be.closeTo(10, 0.1);
            expect(map.extent()[1][0]).to.be.closeTo(30, 0.1);
            expect(map.extent([[-1, -40], [1, -20]]));
            expect(map.extent()[0][1]).to.be.closeTo(-40, 1);
            expect(map.extent()[1][1]).to.be.closeTo(-20, 1);
        });
    });

    describe("surface", function() {
        it("is an SVG element", function() {
           expect(map.surface.node().tagName).to.equal("svg");
        });
    });
});
