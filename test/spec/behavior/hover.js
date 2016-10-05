describe('iD.behaviorHover', function() {
    var container, context;

    beforeEach(function() {
        container = d3.select('body').append('div');
        context = {
            hover: function() {}
        };
    });

    afterEach(function() {
        container.remove();
    });

    describe('#off', function () {
        it('removes the .hover class from all elements', function () {
            container.append('span').attr('class', 'hover');
            container.call(iD.behaviorHover(context).off);
            expect(container.select('span')).not.to.be.classed('hover');
        });
    });

    describe('mouseover', function () {
        it('adds the .hover class to all elements to which the same datum is bound', function () {
            var a = iD.Node({id: 'a'}),
                b = iD.Node({id: 'b'});

            container.selectAll('span')
                .data([a, b, a, b])
                .enter().append('span').attr('class', function(d) { return d.id; });

            container.call(iD.behaviorHover(context));
            iD.utilTriggerEvent(container.selectAll('.a'), 'mouseover');

            expect(container.selectAll('.a.hover').nodes()).to.have.length(2);
            expect(container.selectAll('.b.hover').nodes()).to.have.length(0);
        });

        it('adds the .hover class to all members of a relation', function() {
            container.selectAll('span')
                .data([iD.Relation({id: 'a', members: [{id: 'b'}]}), iD.Node({id: 'b'})])
                .enter().append('span').attr('class', function(d) { return d.id; });

            container.call(iD.behaviorHover(context));
            iD.utilTriggerEvent(container.selectAll('.a'), 'mouseover');

            expect(container.selectAll('.a.hover').nodes()).to.have.length(1);
            expect(container.selectAll('.b.hover').nodes()).to.have.length(1);
        });
    });

    describe('mouseout', function () {
        it('removes the .hover class from all elements', function () {
            container.append('span').attr('class', 'hover');

            container.call(iD.behaviorHover(context));
            iD.utilTriggerEvent(container.selectAll('.hover'), 'mouseout');

            expect(container.selectAll('.hover').nodes()).to.have.length(0);
        });
    });

    describe('alt keydown', function () {
        it('replaces the .hover class with .hover-suppressed', function () {
            container.append('span').attr('class', 'hover');

            container.call(iD.behaviorHover(context).altDisables(true));
            happen.keydown(window, {keyCode: 18});

            expect(container.selectAll('.hover').nodes()).to.have.length(0);
            expect(container.selectAll('.hover-suppressed').nodes()).to.have.length(1);
        });
    });

    describe('alt keyup', function () {
        it('replaces the .hover-suppressed class with .hover', function () {
            container.append('span').attr('class', 'hover-suppressed');

            container.call(iD.behaviorHover(context).altDisables(true));
            happen.keyup(window, {keyCode: 18});

            expect(container.selectAll('.hover').nodes()).to.have.length(1);
            expect(container.selectAll('.hover-suppressed').nodes()).to.have.length(0);
        });
    });
});
