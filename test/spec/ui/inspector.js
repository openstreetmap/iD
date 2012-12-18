describe("iD.Inspector", function () {
    var inspector, element,
        tags   = {highway: 'residential'},
        entity = iD.Entity({type: 'node', id: "n12345", tags: tags});

    beforeEach(function () {
        inspector = iD.Inspector();
        element = d3.select('body')
            .append('div')
            .attr('id', 'inspector-wrap')
            .datum(entity)
            .call(inspector);
    });

    afterEach(function () {
        element.remove();
    });

    describe("#tags", function () {
       it("returns the current tags", function () {
          expect(inspector.tags()).to.eql(tags);
       });
    });

    it("creates input elements for each key-value pair", function () {
        expect(element.selectAll("input[value=highway]")).not.to.be.empty;
        expect(element.selectAll("input[value=residential]")).not.to.be.empty;
    });

    it("creates one trailing pair of empty input elements", function () {
       expect(element.selectAll("input")[0][2].value).to.be.empty;
       expect(element.selectAll("input")[0][3].value).to.be.empty;
    });

    it("sets the 'tag-row-empty' class on the placeholder row", function () {
        expect(element.selectAll(".tag-row:last-child").classed('tag-row-empty')).to.be.true;
    });

    it("removes tags when clicking the remove button", function () {
        happen.click(element.selectAll("button.remove").node());
        expect(inspector.tags()).to.eql({});
    });

    it("adds tags when typing in the placeholder row", function () {
        var k = element.selectAll(".tag-row-empty input.key").node(),
            v = element.selectAll(".tag-row-empty input.value").node();
        k.value = 'k';
        v.value = 'v';
        happen.keyup(k);
        happen.keyup(v);
        expect(inspector.tags()).to.eql({highway: 'residential', k: 'v'});
    });

    it("emits a close event when the close button is clicked", function () {
        var spy = sinon.spy();
        inspector.on('close', spy);

        happen.click(element.select('.close').node());

        expect(spy).to.have.been.calledWith(entity);
    });

    it("emits a changeTags event when the apply button is clicked", function () {
        var spy = sinon.spy();
        inspector.on('changeTags', spy);

        happen.click(element.select('.apply').node());

        expect(spy).to.have.been.calledWith(entity, tags);
    });

    it("emits a remove event when the delete button is clicked", function () {
        var spy = sinon.spy();
        inspector.on('remove', spy);

        happen.click(element.select('.delete').node());

        expect(spy).to.have.been.calledWith(entity);
    });
});
