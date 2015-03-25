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

    it('correctly displays an overlay with no overzoom specified', function() {
        var source = iD.BackgroundSource({ scaleExtent: [6,16] });
        expect(source.validZoom(10)).to.be.true;
        expect(source.validZoom(3)).to.be.false;
        expect(source.validZoom(17)).to.be.true;
    });

    it('correctly displays an overlay with an invalid overzoom', function() {
        var source = iD.BackgroundSource({ scaleExtent: [6,16], overzoom: 'gibberish'});
        expect(source.validZoom(10)).to.be.true;
        expect(source.validZoom(3)).to.be.false;
        expect(source.validZoom(17)).to.be.true;
    });

    it('correctly displays an overlay with overzoom:true', function() {
        var source = iD.BackgroundSource({ scaleExtent: [6,16], overzoom: true});
        expect(source.validZoom(10)).to.be.true;
        expect(source.validZoom(3)).to.be.false;
        expect(source.validZoom(17)).to.be.true;
    });

    it('correctly displays an overlay with overzoom:false', function() {
        var source = iD.BackgroundSource({ scaleExtent: [6,16], overzoom: false});
        expect(source.validZoom(10)).to.be.true;
        expect(source.validZoom(3)).to.be.false;
        expect(source.validZoom(17)).to.be.false;
    });
});
