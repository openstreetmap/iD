describe('iD.ui.cmd', function () {
    var orig,
        ua = navigator.userAgent,
        isPhantom = (navigator.userAgent.match(/PhantomJS/) !== null),
        uaMock = function () { return ua; };

    beforeEach(function() {
        /* eslint-disable no-native-reassign */
        /* mock userAgent */
        if (isPhantom) {
            orig = navigator;
            navigator = Object.create(orig, { userAgent: { get: uaMock }});
        } else {
            orig = navigator.__lookupGetter__('userAgent');
            navigator.__defineGetter__('userAgent', uaMock);
        }
    });

    afterEach(function() {
        /* restore userAgent */
        if (isPhantom) {
            navigator = orig;
        } else {
            navigator.__defineGetter__('userAgent', orig);
        }
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
