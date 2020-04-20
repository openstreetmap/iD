describe('iD.Map', function() {
    var content, context, map;

    beforeEach(function() {
        content = d3.select('body').append('div');
        context = iD.coreContext().init().container(content);
        map = context.map();
        content.call(map);
    });

    afterEach(function() {
        content.remove();
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

        it('respects minzoom', function() {
            map.minzoom(16);
            map.zoom(15);
            expect(map.zoom()).to.equal(16);
        });
    });

    describe('#zoomIn', function() {
        it('increments zoom', function(done) {
            expect(map.zoom(4)).to.equal(map);
            map.zoomIn();
            window.setTimeout(function() {
                d3.timerFlush();
                expect(map.zoom()).to.be.closeTo(5, 1e-6);
                done();
            }, 275);
        });
    });

    describe('#zoomOut', function() {
        it('decrements zoom', function(done) {
            expect(map.zoom(4)).to.equal(map);
            map.zoomOut();
            window.setTimeout(function() {
                d3.timerFlush();
                expect(map.zoom()).to.be.closeTo(3, 1e-6);
                done();
            }, 275);
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
            expect(map.center()[0]).to.be.closeTo(0, 1e-6);
            expect(map.center()[1]).to.be.closeTo(0, 1e-6);
            expect(map.center([10, 15])).to.equal(map);
            expect(map.center()[0]).to.be.closeTo(10, 1e-6);
            expect(map.center()[1]).to.be.closeTo(15, 1e-6);
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
            expect(map.centerEase([20, 20], 250)).to.equal(map);
            window.setTimeout(function() {
                d3.timerFlush();
                expect(map.center()[0]).to.be.closeTo(20, 1e-6);
                expect(map.center()[1]).to.be.closeTo(20, 1e-6);
                done();
            }, 275);
        });
    });

    describe('#centerZoom', function() {
        it('gets and sets center and zoom', function() {
            expect(map.centerZoom([20, 25], 4)).to.equal(map);
            expect(map.center()[0]).to.be.closeTo(20, 1e-6);
            expect(map.center()[1]).to.be.closeTo(25, 1e-6);
            expect(map.zoom()).to.be.equal(4);
        });
    });

    describe('#extent', function() {
        it('gets and sets extent', function() {
            map.dimensions([100, 100])
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

    describe('surface', function() {
        it('is an SVG element', function() {
           expect(map.surface.node().tagName).to.equal('svg');
        });
    });

    describe('cursors', function() {
        var mode, behavior, point, vertex, line, area, midpoint;

        beforeEach(function() {
            mode = d3.select('body').append('div');
            behavior = mode.append('div');

            point    = behavior.append('div').attr('class', 'node point');
            vertex   = behavior.append('div').attr('class', 'node vertex');
            line     = behavior.append('div').attr('class', 'way line');
            area     = behavior.append('div').attr('class', 'way area');
            midpoint = behavior.append('div').attr('class', 'midpoint');
        });

        afterEach(function() {
            mode.remove();
        });

        function cursor(selection) {
            return window.getComputedStyle(selection.node()).cursor;
        }

        specify('points use select-point cursor in browse and select modes', function() {
            mode.attr('class', 'ideditor mode-browse');
            expect(cursor(point)).to.match(/cursor-select-point/);
            mode.attr('class', 'ideditor mode-select');
            expect(cursor(point)).to.match(/cursor-select-point/);
        });

        specify('vertices use select-vertex cursor in browse and select modes', function() {
            mode.attr('class', 'ideditor mode-browse');
            expect(cursor(vertex)).to.match(/cursor-select-vertex/);
            mode.attr('class', 'ideditor mode-select');
            expect(cursor(vertex)).to.match(/cursor-select-vertex/);
        });

        specify('lines use select-line cursor in browse and select modes', function() {
            mode.attr('class', 'ideditor mode-browse');
            expect(cursor(line)).to.match(/cursor-select-line/);
            mode.attr('class', 'ideditor mode-select');
            expect(cursor(line)).to.match(/cursor-select-line/);
        });

        specify('areas use select-area cursor in browse and select modes', function() {
            mode.attr('class', 'ideditor mode-browse');
            expect(cursor(area)).to.match(/cursor-select-area/);
            mode.attr('class', 'ideditor mode-select');
            expect(cursor(area)).to.match(/cursor-select-area/);
        });

        specify('midpoints use select-split cursor in browse and select modes', function() {
            mode.attr('class', 'ideditor mode-browse');
            expect(cursor(midpoint)).to.match(/cursor-select-split/);
            mode.attr('class', 'ideditor mode-select');
            expect(cursor(midpoint)).to.match(/cursor-select-split/);
        });

        specify('features use select-add cursor for adding to a selection', function() {
            mode.attr('class', 'ideditor mode-select');
            behavior.attr('class', 'behavior-multiselect');
            expect(cursor(point)).to.match(/cursor-select-add/);
            expect(cursor(vertex)).to.match(/cursor-select-add/);
            expect(cursor(line)).to.match(/cursor-select-add/);
            expect(cursor(area)).to.match(/cursor-select-add/);
        });

        specify('features use select-remove cursor for removing from a selection', function() {
            mode.attr('class', 'ideditor mode-select');
            behavior.attr('class', 'behavior-multiselect');
            point.classed('selected', true);
            vertex.classed('selected', true);
            line.classed('selected', true);
            area.classed('selected', true);
            expect(cursor(point)).to.match(/cursor-select-remove/);
            expect(cursor(vertex)).to.match(/cursor-select-remove/);
            expect(cursor(line)).to.match(/cursor-select-remove/);
            expect(cursor(area)).to.match(/cursor-select-remove/);
        });

        specify('targeted ways use draw-connect-line cursor in draw modes', function() {
            behavior.attr('class', 'behavior-hover');
            line.classed('target', true);
            area.classed('target', true);
            mode.attr('class', 'ideditor mode-draw-line');
            expect(cursor(line)).to.match(/cursor-draw-connect-line/);
            expect(cursor(area)).to.match(/cursor-draw-connect-line/);
            mode.attr('class', 'ideditor mode-draw-area');
            expect(cursor(line)).to.match(/cursor-draw-connect-line/);
            expect(cursor(area)).to.match(/cursor-draw-connect-line/);
            mode.attr('class', 'ideditor mode-add-line');
            expect(cursor(line)).to.match(/cursor-draw-connect-line/);
            expect(cursor(area)).to.match(/cursor-draw-connect-line/);
            mode.attr('class', 'ideditor mode-add-area');
            expect(cursor(line)).to.match(/cursor-draw-connect-line/);
            expect(cursor(area)).to.match(/cursor-draw-connect-line/);
            mode.attr('class', 'ideditor mode-drag-node');
            expect(cursor(line)).to.match(/cursor-draw-connect-line/);
            expect(cursor(area)).to.match(/cursor-draw-connect-line/);
        });

        specify('targeted vertices use draw-connect-vertex cursor in draw modes', function() {
            behavior.attr('class', 'behavior-hover');
            vertex.classed('target', true);
            mode.attr('class', 'ideditor mode-draw-line');
            expect(cursor(vertex)).to.match(/cursor-draw-connect-vertex/);
            mode.attr('class', 'ideditor mode-draw-area');
            expect(cursor(vertex)).to.match(/cursor-draw-connect-vertex/);
            mode.attr('class', 'ideditor mode-add-line');
            expect(cursor(vertex)).to.match(/cursor-draw-connect-vertex/);
            mode.attr('class', 'ideditor mode-add-area');
            expect(cursor(vertex)).to.match(/cursor-draw-connect-vertex/);
            mode.attr('class', 'ideditor mode-drag-node');
            expect(cursor(vertex)).to.match(/cursor-draw-connect-vertex/);
        });
    });
});
