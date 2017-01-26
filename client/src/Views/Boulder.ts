/*
module Boulder
( createBoulder
, boulderView
) where
*/


import * as Avers from 'avers';
import {App, refresh, navigateTo, navigateToFn} from '../app';

import {site} from './Components/Site';

import {DropDownInput} from './Components/DropdownInput';
import {NumberInput} from './Components/NumberInput';

import {Boulder} from '../storage';

import {createBoulder} from '../actions';


export function
createBoulderItem(app: App) {

    function createNewBoulder(e) {
        e.stopPropagation();
        createBoulder(app);
    }

    if(app.data.role == "user")
        return React.DOM.div
            ( { className: 'plain-navbar-item' }
            , ''
            );

    if (app.createBoulderPromise) {
        return React.DOM.div
            ( { className: 'plain-navbar-item' }
            , React.DOM.i({ className: 'plus square outlined icon' })
            , 'Creating boulder...'
            );

    } else {
        return React.DOM.div
            ( { className: 'navbar-item', onClick: createNewBoulder }
            , React.DOM.i({ className: 'plus square outlined icon' })
            , 'Create boulder'
            );
    }
}


export function
boulderView(app: App, boulderId: string) {

    var boulderC = Avers.lookupEditable<Boulder>(
        app.data.aversH, boulderId);

    var boulderE = boulderC.get(undefined);

    return site
        ( app
        , boulderHeader(boulderE)
        , boulderDetailsEditor(boulderE)
        );
}


function boulderHeader(boulder : Avers.Editable<Boulder>) : any {
    return React.DOM.div
        ( {}
        , boulder.objectId
        );
}

function formRow(label, content) {
     return React.DOM.div
         ( { className: 'form-row' }
         , React.DOM.div
             ( { className: 'label' }
             , label
             )
         , React.DOM.div
             ( { className: 'content' }
             , content
             )
         );
}

function boulderDetailsEditor(boulderE: Avers.Editable<Boulder>) {
     var boulder = boulderE.content;

     var grades  = ['yellow', 'green', 'orange', 'blue', 'red', 'white'];
     var sectors = ['starship', 'bigboss', 'dune', 'klagemauer', 'kurswand', 'spektrumone', 'spektrumtwo', 'spektrumthree', 'spektrumfour'];

     return React.DOM.div
        ( { className: 'boulder-details-editor' }
         , React.DOM.div
             ( { className: 'form' }
             , formRow
                 ( 'Name'
                 , React.DOM.input
                     ( { type: 'text', value: boulder.name, onChange: function(ev) {
                         boulder.name = (<HTMLInputElement>ev.target).value;
                         }
                     }
                     )
                 )
             , formRow
                 ( "Sector"
                 , DropDownInput({ object: boulder, field: 'sector', options: sectors })
                 )
             , formRow
                 ( "Grade"
                 , DropDownInput({ object: boulder, field: 'grade', options: grades })
                 )
             , formRow
                 ( 'Grade Nr'
                 , NumberInput({ object: boulder, field: 'gradeNr' })
                 )
             )
        );
}
