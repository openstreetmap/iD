describe('iD.BackgroundSource', function() {
    it('does not error with blank template', function() {
        var source = iD.BackgroundSource({ template: '' });
        expect(source.url([0,1,2])).to.equal('');
    });

    it('generates a tile-generating source', function() {
        var source = iD.BackgroundSource({ template: '{z}/{x}/{y}' });
        expect(source.url([0,1,2])).to.equal('2/0/1');
    });

    it('supports subdomains', function() {
        var source = iD.BackgroundSource({ template: '{switch:a,b}/{z}/{x}/{y}'});
        expect(source.url([0,1,2])).to.equal('b/2/0/1');
    });

    it('distributes requests between subdomains', function() {
        var source = iD.BackgroundSource({ template: '{switch:a,b}/{z}/{x}/{y}' });
        expect(source.url([0,1,1])).to.equal('b/1/0/1');
        expect(source.url([0,2,1])).to.equal('a/1/0/2');
    });

    it('displays overlays on the correct zoom levels', function() {
        var source = iD.BackgroundSource({ scaleExtent: [6,16], name: 'Custom overlay'});
        expect(source.validZoom(10)).to.be.true;
        expect(source.validZoom(3)).to.be.false;
        expect(source.validZoom(17)).to.be.false;
    });

    it('displays the Locator Overlay on the correct zoom levels', function() {
        var source = iD.BackgroundSource({ scaleExtent: [6,16], name: 'Locator Overlay'});
        expect(source.validZoom(10)).to.be.true;
        expect(source.validZoom(3)).to.be.false;
        expect(source.validZoom(17)).to.be.false;
    });
});