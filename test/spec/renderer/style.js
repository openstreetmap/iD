describe('iD.Style', function() {
    describe('#waystack', function() {
        it('stacks bridges over non-bridges', function() {
            var a = { tags: { bridge: 'yes' } },
            b = { tags: {} };
            expect(iD.Style.waystack(a, b)).to.equal(1);
            expect(iD.Style.waystack(b, a)).to.equal(-1);
        });

        it('stacks layers', function() {
            var a = { tags: { layer: 1 } },
            b = { tags: { layer: 0 } };
            expect(iD.Style.waystack(a, b)).to.equal(1);
            expect(iD.Style.waystack(b, a)).to.equal(-1);
        });
    });

    describe('#styleClasses', function() {
        var selection;

        beforeEach(function () {
            selection = d3.select(document.createElement('div'));
        });

        it('adds no classes to elements whose datum has no tags', function() {
            selection
                .datum(iD.Entity())
                .call(iD.Style.styleClasses());
            expect(selection.attr('class')).to.equal('');
        });

        it('adds classes for highway tags', function() {
            selection
                .datum(iD.Entity({tags: {highway: 'primary'}}))
                .call(iD.Style.styleClasses());
            expect(selection.attr('class')).to.equal('tag-highway tag-highway-primary');
        });

        it('removes classes for tags that are no longer present', function() {
            selection
                .attr('class', 'tag-highway tag-highway-primary')
                .datum(iD.Entity())
                .call(iD.Style.styleClasses());
            expect(selection.attr('class')).to.equal('');
        });

        it('preserves existing non-"tag-"-prefixed classes', function() {
            selection
                .attr('class', 'selected')
                .datum(iD.Entity())
                .call(iD.Style.styleClasses());
            expect(selection.attr('class')).to.equal('selected');
        });

        it('works on SVG elements', function() {
            selection = d3.select(document.createElementNS('http://www.w3.org/2000/svg', 'g'));
            selection
                .datum(iD.Entity())
                .call(iD.Style.styleClasses());
            expect(selection.attr('class')).to.equal('');
        });
    });
});
