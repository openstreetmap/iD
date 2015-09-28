describe('iD.ui.cmd', function () {
    var detect, os;

    beforeEach(function() {
        detect = iD.detect;
        iD.detect = function() {
            return { os: os };
        };
    });

    afterEach(function() {
        iD.detect = detect;
    });

    it('does not overwrite mac keybindings', function () {
        os = 'mac';
        expect(iD.ui.cmd('⌘A')).to.eql('⌘A');
    });

    it('changes keys to linux versions', function () {
        os = 'linux';
        expect(iD.ui.cmd('⌘A')).to.eql('Ctrl+A');
        expect(iD.ui.cmd('⇧A')).to.eql('Shift+A');
        expect(iD.ui.cmd('⌘⇧A')).to.eql('Ctrl+Shift+A');
        expect(iD.ui.cmd('⌘⇧Z')).to.eql('Ctrl+Shift+Z');
    });

    it('changes keys to win versions', function () {
        os = 'win';
        expect(iD.ui.cmd('⌘A')).to.eql('Ctrl+A');
        expect(iD.ui.cmd('⇧A')).to.eql('Shift+A');
        expect(iD.ui.cmd('⌘⇧A')).to.eql('Ctrl+Shift+A');
        expect(iD.ui.cmd('⌘⇧Z')).to.eql('Ctrl+Y');  // special case
    });

    it('handles multi-character keys', function () {
        os = 'win';
        expect(iD.ui.cmd('f11')).to.eql('f11');
        expect(iD.ui.cmd('⌘plus')).to.eql('Ctrl+plus');
    });

});
