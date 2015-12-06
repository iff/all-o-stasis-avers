import * as Avers from 'avers';
import {App, refresh} from '../../app';

export function site(app: App, ...content) {

    function onClick() {
        refresh(app);
    }

    var transientNotification;

    var localChanges = Avers.localChanges(app.data.aversH);

    if (Avers.networkRequests(app.data.aversH).length > 0) {
        transientNotification = React.DOM.div
            ( { className: 'transient-notification' }
            , 'Saving...'
            );

    } else if (localChanges.length > 0) {
        var numLocalChanges = localChanges.reduce((a, x) => {
            return a + x.changes.length;
        }, 0);

        transientNotification = React.DOM.div
            ( { className: 'transient-notification' }
            , '' + numLocalChanges + ' unsaved changes'
            );
    }

    content.unshift({ className: 'site', onClick: onClick });
    content.push(transientNotification);

    return React.DOM.div.apply(React.DOM, content);
}
