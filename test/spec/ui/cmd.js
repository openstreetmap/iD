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
        expect(iD.ui.cmd('⌘a')).to.eql('⌘a');
    });

    it('changes keys to linux versions', function () {
        os = 'linux';
        expect(iD.ui.cmd('⌘a')).to.eql('Ctrl+a');
        expect(iD.ui.cmd('⇧a')).to.eql('Shift+a');
    });
});
