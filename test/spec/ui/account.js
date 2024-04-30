describe('iD.uiAccount', function () {
    it('properly escapes user name', function() {
        var selection = d3.select('body').append('div');
        var osmConnectionMock = {
            authenticated: () => true,
            userDetails: (callback) => {
                callback(null, {
                    display_name: 'x<br>y'
                });
            },
            userURL: () => '',
            on: (handler, callback) => {
                if (handler === 'change.account') {
                    onChangeAccountHandler = callback;
                }
            }
        };
        var onChangeAccountHandler;
        iD.uiAccount({ connection: () => osmConnectionMock })(selection);
        onChangeAccountHandler.call();
        expect(selection.select('.userInfo span.label').text()).to.equal('x<br>y');
    });
});
