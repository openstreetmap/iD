describe("iD.behavior.Hover", function() {
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

    describe("#off", function () {
        it("removes the .hover class from all elements", function () {
            container.append('span').attr('class', 'hover');
            container.call(iD.behavior.Hover(context).off);
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

            container.call(iD.behavior.Hover(context));
            container.selectAll('.a').trigger('mouseover');

            expect(container.selectAll('.a.hover')[0]).to.have.length(2);
            expect(container.selectAll('.b.hover')[0]).to.have.length(0);
        });

        it("adds the .hover class to all members of a relation", function() {
            container.selectAll('span')
                .data([{id: 'a', type: 'relation', members: [{id: 'b'}]}, {id: 'b'}])
                .enter().append('span').attr('class', function(d) { return d.id; });

            container.call(iD.behavior.Hover(context));
            container.selectAll('.a').trigger('mouseover');

            expect(container.selectAll('.a.hover')[0]).to.have.length(1);
            expect(container.selectAll('.b.hover')[0]).to.have.length(1);
        });
    });

    describe("mouseout", function () {
        it("removes the .hover class from all elements", function () {
            container.append('span').attr('class', 'hover');

            container.call(iD.behavior.Hover(context));
            container.selectAll('.hover').trigger('mouseout');

            expect(container.selectAll('.hover')[0]).to.have.length(0);
        });
    });

    describe("alt keydown", function () {
        it("replaces the .hover class with .hover-suppressed", function () {
            container.append('span').attr('class', 'hover');

            container.call(iD.behavior.Hover().altDisables(true));
            happen.keydown(document, {keyCode: 18});

            expect(container.selectAll('.hover')[0]).to.have.length(0);
            expect(container.selectAll('.hover-suppressed')[0]).to.have.length(1);
        });
    });

    describe("alt keyup", function () {
        it("replaces the .hover-suppressed class with .hover", function () {
            container.append('span').attr('class', 'hover-suppressed');

            container.call(iD.behavior.Hover().altDisables(true));
            happen.keyup(document, {keyCode: 18});

            expect(container.selectAll('.hover')[0]).to.have.length(1);
            expect(container.selectAll('.hover-suppressed')[0]).to.have.length(0);
        });
    });
});
