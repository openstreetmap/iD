import { select as d3_select } from 'd3-selection';

describe('iD.behaviorHover', function() {
    var _container;
    var _context;
    var _graph;

    beforeEach(function() {
        _container = d3_select('body').append('div');
        _context = {
            hover: function() {},
            mode: function() { return { id: 'browse' }; },
            hasEntity: function(d) { return _graph && _graph.hasEntity(d); }
        };
    });

    afterEach(function() {
        _container.remove();
        _graph = null;
    });

    describe('#off', function () {
        it('removes the .hover class from all elements', function () {
            _container.append('span').attr('class', 'hover');
            _container.call(iD.behaviorHover(_context).off);
            expect(_container.select('span').classed('hover')).toBe(false);
        });
        it('removes the .hover-disabled class from the surface element', function () {
            _container.attr('class', 'hover-disabled');
            _container.call(iD.behaviorHover(_context).off);
            expect(_container.classed('hover-disabled')).toBe(false);
        });
    });

    describe('mouseover and mouseout', function () {
        it('adds the .hover class to all elements to which the same datum is bound', function () {
            var a = new iD.osmNode({id: 'a'});
            var b = new iD.osmNode({id: 'b'});
            _graph = new iD.coreGraph([a, b]);

            _container.selectAll('span')
                .data([a, b, a, b])
                .enter().append('span').attr('class', function(d) { return d.id; });

            _container.call(iD.behaviorHover(_context));
            iD.utilTriggerEvent(_container.select('.a'), 'mouseover');

            expect(_container.selectAll('.a.hover').size()).toEqual(2);
            expect(_container.selectAll('.b.hover').size()).toEqual(0);

            iD.utilTriggerEvent(_container.select('.a'), 'mouseout');
            expect(_container.selectAll('.hover').size()).toEqual(0);
        });

        it('adds the .hover class to all members of a relation', function() {
            var a = new iD.osmRelation({id: 'a', members: [{id: 'b'}]});
            var b = new iD.osmNode({id: 'b'});
            _graph = new iD.coreGraph([a, b]);

            _container.selectAll('span')
                .data([a, b])
                .enter().append('span').attr('class', function(d) { return d.id; });

            _container.call(iD.behaviorHover(_context));
            iD.utilTriggerEvent(_container.selectAll('.a'), 'mouseover');

            expect(_container.selectAll('.a.hover').size()).toEqual(1);
            expect(_container.selectAll('.b.hover').size()).toEqual(1);

            iD.utilTriggerEvent(_container.selectAll('.a'), 'mouseout');
            expect(_container.selectAll('.hover').size()).toEqual(0);
        });
    });

    describe('alt keydown', function () {
        it('replaces the .hover class with .hover-suppressed', function () {
            _container.append('span').attr('class', 'hover');
            _container.call(iD.behaviorHover(_context).altDisables(true));

            window.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 18 }));
            expect(_container.selectAll('.hover').size()).toEqual(0);
            expect(_container.selectAll('.hover-suppressed').size()).toEqual(1);
            window.dispatchEvent(new KeyboardEvent('keyup', { keyCode: 18 }));
        });

        it('adds the .hover-disabled class to the surface', function () {
            _container.call(iD.behaviorHover(_context).altDisables(true));

            window.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 18 }));
            expect(_container.classed('hover-disabled')).toBe(true);
            window.dispatchEvent(new KeyboardEvent('keyup', { keyCode: 18 }));
        });
    });

    describe('alt keyup', function () {
        it('replaces the .hover-suppressed class with .hover', function () {
            _container.append('span').attr('class', 'hover-suppressed');
            _container.call(iD.behaviorHover(_context).altDisables(true));

            window.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 18 }));
            window.dispatchEvent(new KeyboardEvent('keyup', { keyCode: 18 }));
            expect(_container.selectAll('.hover').size()).toEqual(1);
            expect(_container.selectAll('.hover-suppressed').size()).toEqual(0);
        });

        it('removes the .hover-disabled class from the surface', function () {
            _container.call(iD.behaviorHover(_context).altDisables(true));

            window.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 18 }));
            window.dispatchEvent(new KeyboardEvent('keyup', { keyCode: 18 }));
            expect(_container.classed('hover-disabled')).toBe(false);
        });
    });
});
