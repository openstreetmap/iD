describe("iD.behavior.Hover", function() {
    var container;

    beforeEach(function() {
        container = d3.select('body').append('div');
    });

    afterEach(function() {
        container.remove();
    });

    describe("#on", function () {
        it("adds the .behavior-hover class to the selection", function () {
            container.call(iD.behavior.Hover());
            expect(container).to.be.classed('behavior-hover')
        });
    });

    describe("#off", function () {
        it("removes the .behavior-hover class from the selection", function () {
            container.classed('behavior-hover', true);
            container.call(iD.behavior.Hover().off);
            expect(container).not.to.be.classed('behavior-hover')
        });

        it("removes the .hover class from all elements", function () {
            container.append('span').attr('class', 'hover');
            container.call(iD.behavior.Hover().off);
            expect(container.select('span')).not.to.be.classed('hover')
        });
    });

    describe("mouseover", function () {
        it("adds the .hover class to all elements to which the same datum is bound", function () {
            var a = {id: 'a', type: 'node'},
                b = {id: 'b', type: 'node'};

            container.selectAll('span')
                .data([a, b, a, b])
                .enter().append('span').attr('class', function(d) { return d.id; });

            container.call(iD.behavior.Hover());
            container.selectAll('.a').trigger('mouseover');

            expect(container.selectAll('.a.hover')[0]).to.have.length(2);
            expect(container.selectAll('.b.hover')[0]).to.have.length(0);
        });

        it("adds the .hover class to all members of a relation", function() {
            container.selectAll('span')
                .data([{id: 'a', type: 'relation', members: [{id: 'b'}]}, {id: 'b'}])
                .enter().append('span').attr('class', function(d) { return d.id; });

            container.call(iD.behavior.Hover());
            container.selectAll('.a').trigger('mouseover');

            expect(container.selectAll('.a.hover')[0]).to.have.length(1);
            expect(container.selectAll('.b.hover')[0]).to.have.length(1);
        });
    });

    describe("mouseout", function () {
        it("removes the .hover class from all elements", function () {
            container.append('span').attr('class', 'hover');

            container.call(iD.behavior.Hover());
            container.selectAll('.hover').trigger('mouseout');

            expect(container.selectAll('.hover')[0]).to.have.length(0);
        });
    });
});
