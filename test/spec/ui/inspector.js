describe("iD.ui.Inspector", function () {
    var inspector, element,
        tags = {highway: 'residential'},
        entity, context;

    beforeEach(function () {
        entity = iD.Entity({type: 'node', id: "n12345", tags: tags});
        context = iD();
        inspector = iD.ui.Inspector(context, entity);
        element = d3.select('body')
            .append('div')
            .attr('id', 'inspector-wrap')
            .call(inspector);
    });

    afterEach(function () {
        element.remove();
    });

    it("emits a close event when the apply button is clicked", function () {
        var spy = sinon.spy();
        inspector.on('close', spy);

        element.select('.apply').trigger('click');

        expect(spy).to.have.been.calledWith(entity);
    });

    xit("emits a changeTags event when the apply button is clicked", function () {
        var spy = sinon.spy();
        inspector.on('changeTags', spy);

        element.select('.apply').trigger('click');

        expect(spy).to.have.been.calledWith(entity, tags);
    });
});
