describe('iD.behaviorHover', function() {
    var _container;
    var _context;
    var _graph;

    beforeEach(function() {
        _container = d3.select('body').append('div');
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
            expect(_container.select('span').classed('hover')).to.be.false;
        });
        it('removes the .hover-disabled class from the surface element', function () {
            _container.attr('class', 'hover-disabled');
            _container.call(iD.behaviorHover(_context).off);
            expect(_container.classed('hover-disabled')).to.be.false;
        });
    });

    describe('mouseover and mouseout', function () {
        it('adds the .hover class to all elements to which the same datum is bound', function () {
            var a = iD.osmNode({id: 'a'});
            var b = iD.osmNode({id: 'b'});
            _graph = iD.coreGraph([a, b]);

            _container.selectAll('span')
                .data([a, b, a, b])
                .enter().append('span').attr('class', function(d) { return d.id; });

            _container.call(iD.behaviorHover(_context));
            iD.utilTriggerEvent(_container.selectAll('.a'), 'mouseover');

            expect(_container.selectAll('.a.hover').nodes()).to.have.length(2);
            expect(_container.selectAll('.b.hover').nodes()).to.have.length(0);

            iD.utilTriggerEvent(_container.selectAll('.a'), 'mouseout');
            expect(_container.selectAll('.hover').nodes()).to.have.length(0);
        });

        it('adds the .hover class to all members of a relation', function() {
            var a = iD.osmRelation({id: 'a', members: [{id: 'b'}]});
            var b = iD.osmNode({id: 'b'});
            _graph = iD.coreGraph([a, b]);

            _container.selectAll('span')
                .data([a, b])
                .enter().append('span').attr('class', function(d) { return d.id; });

            _container.call(iD.behaviorHover(_context));
            iD.utilTriggerEvent(_container.selectAll('.a'), 'mouseover');

            expect(_container.selectAll('.a.hover').nodes()).to.have.length(1);
            expect(_container.selectAll('.b.hover').nodes()).to.have.length(1);

            iD.utilTriggerEvent(_container.selectAll('.a'), 'mouseout');
            expect(_container.selectAll('.hover').nodes()).to.have.length(0);
        });
    });

    describe('alt keydown', function () {
        it('replaces the .hover class with .hover-suppressed', function () {
            _container.append('span').attr('class', 'hover');
            _container.call(iD.behaviorHover(_context).altDisables(true));

            happen.keydown(window, { keyCode: 18 });
            expect(_container.selectAll('.hover').nodes()).to.have.length(0);
            expect(_container.selectAll('.hover-suppressed').nodes()).to.have.length(1);
            happen.keyup(window, { keyCode: 18 });
        });

        it('adds the .hover-disabled class to the surface', function () {
            _container.call(iD.behaviorHover(_context).altDisables(true));

            happen.keydown(window, { keyCode: 18 });
            expect(_container.classed('hover-disabled')).to.be.true;
            happen.keyup(window, { keyCode: 18 });
        });
    });

    describe('alt keyup', function () {
        it('replaces the .hover-suppressed class with .hover', function () {
            _container.append('span').attr('class', 'hover-suppressed');
            _container.call(iD.behaviorHover(_context).altDisables(true));

            happen.keydown(window, { keyCode: 18 });
            happen.keyup(window, { keyCode: 18 });
            expect(_container.selectAll('.hover').nodes()).to.have.length(1);
            expect(_container.selectAll('.hover-suppressed').nodes()).to.have.length(0);
        });

        it('removes the .hover-disabled class from the surface', function () {
            _container.call(iD.behaviorHover(_context).altDisables(true));

            happen.keydown(window, { keyCode: 18 });
            happen.keyup(window, { keyCode: 18 });
            expect(_container.classed('hover-disabled')).to.be.false;
        });
    });
});
