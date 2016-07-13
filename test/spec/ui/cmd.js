describe('iD.ui.cmd', function () {
    var origNavigator, ua;

    beforeEach(function() {
        /* eslint-disable no-native-reassign */
        origNavigator = navigator;
        navigator = Object.create(origNavigator, {
            userAgent: { get: function() { return ua; } }
        });
    });

    afterEach(function() {
        navigator = origNavigator;
        /* eslint-enable no-native-reassign */
    });

    it('does not overwrite mac keybindings', function () {
        ua = 'Mac';
        expect(iD.ui.cmd('⌘A')).to.eql('⌘A');
    });

    it('changes keys to linux versions', function () {
        ua = 'Linux';
        expect(iD.ui.cmd('⌘A')).to.eql('Ctrl+A');
        expect(iD.ui.cmd('⇧A')).to.eql('Shift+A');
        expect(iD.ui.cmd('⌘⇧A')).to.eql('Ctrl+Shift+A');
        expect(iD.ui.cmd('⌘⇧Z')).to.eql('Ctrl+Shift+Z');
    });

    it('changes keys to win versions', function () {
        ua = 'Win';
        expect(iD.ui.cmd('⌘A')).to.eql('Ctrl+A');
        expect(iD.ui.cmd('⇧A')).to.eql('Shift+A');
        expect(iD.ui.cmd('⌘⇧A')).to.eql('Ctrl+Shift+A');
        expect(iD.ui.cmd('⌘⇧Z')).to.eql('Ctrl+Y');  // special case
    });

    it('handles multi-character keys', function () {
        ua = 'Win';
        expect(iD.ui.cmd('f11')).to.eql('f11');
        expect(iD.ui.cmd('⌘plus')).to.eql('Ctrl+plus');
    });

});
