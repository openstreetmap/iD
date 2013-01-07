describe("iD.behavior.Hover", function() {
    var container;

    beforeEach(function() {
        container = d3.select('body').append('div');
    });

    afterEach(function() {
        container.remove();
    });

    describe("mouseover", function () {
        it("adds the 'hover' class to all elements to which the same datum is bound", function () {
            container.selectAll('span')
                .data(['a', 'b', 'a', 'b'])
                .enter().append('span').attr('class', Object);

            container.call(iD.behavior.Hover());
            container.selectAll('.a').trigger('mouseover');

            expect(container.selectAll('.a.hover')[0]).to.have.length(2);
            expect(container.selectAll('.b.hover')[0]).to.have.length(0);
        });
    });

    describe("mouseout", function () {
        it("removes the 'hover' class from all elements", function () {
            container.append('span').attr('class', 'hover');

            container.call(iD.behavior.Hover());
            container.selectAll('.hover').trigger('mouseout');

            expect(container.selectAll('.hover')[0]).to.have.length(0);
        });
    });
});
