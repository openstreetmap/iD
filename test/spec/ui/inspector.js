describe("iD.ui.inspector", function () {
    var inspector, element,
        tags = {highway: 'residential'},
        entity;

    function render() {
        inspector = iD.ui.inspector();
        element = d3.select('body')
            .append('div')
            .attr('id', 'inspector-wrap')
            .datum(entity)
            .call(inspector);
    }

    beforeEach(function () {
        entity = iD.Entity({type: 'node', id: "n12345", tags: tags});
        render();
    });

    afterEach(function () {
        element.remove();
    });

    describe("#tags", function () {
        it("returns the current tags", function () {
            expect(inspector.tags()).to.eql(tags);
        });

        it("returns updated tags when input values have changed", function () {
            element.selectAll("input.key").property('value', 'k');
            element.selectAll("input.value").property('value', 'v');
            expect(inspector.tags()).to.eql({k: 'v'});
        });
    });

    it("creates input elements for each key-value pair", function () {
        expect(element.selectAll("input[value=highway]")).not.to.be.empty;
        expect(element.selectAll("input[value=residential]")).not.to.be.empty;
    });

    it("creates a pair of empty input elements if the entity has no tags", function () {
        element.remove();
        entity = entity.update({tags: {}});
        render();
        expect(element.selectAll("input.value").property('value')).to.be.empty;
        expect(element.selectAll("input.key").property('value')).to.be.empty;
    });

    it("adds tags when clicking the add button", function () {
        element.selectAll("button.add-tag").trigger('click');
        expect(element.selectAll("input")[0][2].value).to.be.empty;
        expect(element.selectAll("input")[0][3].value).to.be.empty;
    });

    it("removes tags when clicking the remove button", function () {
        element.selectAll("button.remove").trigger('click');
        expect(inspector.tags()).to.eql({});
    });

    it("emits a close event when the apply button is clicked", function () {
        var spy = sinon.spy();
        inspector.on('close', spy);

        element.select('.apply').trigger('click');

        expect(spy).to.have.been.calledWith(entity);
    });

    it("emits a changeTags event when the apply button is clicked", function () {
        var spy = sinon.spy();
        inspector.on('changeTags', spy);

        element.select('.apply').trigger('click');

        expect(spy).to.have.been.calledWith(entity, tags);
    });

    it("emits a remove event when the delete button is clicked", function () {
        var spy = sinon.spy();
        inspector.on('remove', spy);

        element.select('.delete').trigger('click');

        expect(spy).to.have.been.calledWith(entity);
    });
});
