/*
module NavBar
( navBar
) where
*/


import * as Avers from 'avers';
import {App, navigateTo, navigateToFn} from '../../app';
import * as Boulder from '../Boulder';

var homeItem = React.DOM.div
    ( { className: 'navbar-item', onClick: navigateToFn('/') }
    , React.DOM.i({ className: 'server icon' })
    , 'Boulders'
    );

// spacer
var flexItem = React.DOM.div
    ( { className: 'flex-navbar-item' }
    );

// end session
function signOutItem(app: App) {
    return React.DOM.div
        ( { className: 'navbar-item', onClick: doSignOutF(app) }
        , 'Sign out'
        );
}

var signUpItem = React.DOM.div
    ( { className: 'navbar-item', onClick: navigateToFn('/signup') }
    , 'Sign up'
    );

var signInItem = React.DOM.div
    ( { className: 'navbar-item', onClick: navigateToFn('/login') }
    , 'Sign in'
    );


export function
navBar(app: App) {
    if (app.data.session.objId) {
        return React.DOM.div
            ( { className: 'navbar' }
            , homeItem
            , flexItem
            , Boulder.createBoulderItem(app)
            , signOutItem(app)
            );

    } else {
        return React.DOM.div
            ( { className: 'navbar' }
            , homeItem
            , flexItem
            , signUpItem
            , signInItem
            );
    }
}


function doSignOutF(app: App) {
    return e => {
        e.stopPropagation();
        Avers.signout(app.data.session).then(() => {
            navigateTo('/');
        });
    };
}
