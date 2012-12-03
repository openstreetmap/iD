describe("iD", function () {
    var container, editor;

    beforeEach(function() {
        container = d3.select('body').append('div');
        editor = iD()
        editor.map().background.source(null);
        editor.call(container);
    });

    afterEach(function() {
        container.remove();
    });

    it("allows an editor to add a place", function () {
        // click 'Add Place'
        // click on map
        // select tags
        // save
        // check uploaded XML
    });
});
