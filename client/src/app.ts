/// <reference path="./ext/react.d.ts" />
/// <reference path="./ext/react-dom.d.ts" />

/*
module App
( App
, Data
, refresh
, loadView
, navigateTo
, navigateToFn
) where
*/


import * as Avers from './lib/avers';
import {Account, Boulder} from './storage';

import configObject from './config';

declare var page;

// -----------------------------------------------------------------------------
// Config
//
// Static coniguration that is loaded during initialiation.

export class Config {
    apiHost : string;
}

Avers.definePrimitive(Config, 'apiHost', '//localhost:8000');

export const config = Avers.mk<Config>(Config, configObject);



// -----------------------------------------------------------------------------
// App

export class App {

    createBoulderPromise : Promise<string> = undefined;

    constructor
      ( public containerElement : Element
      , public data             : Data
      , public mkViewFn         : (app: App) => any
      ) {}
}


export const infoTable = new Map<string, Avers.ObjectConstructor<any>>();
infoTable.set('account', Account);
infoTable.set('boulder', Boulder);


export class Data {

    session : Avers.Session;

    // Add collections, statics, ephemerals and other data which is managed
    // by avers here.
    //
    // clientVersion : Avers.Ephemeral<string>;
    // accountsCollection : Avers.ObjectCollection;

    public ownedBoulderCollection : any;

    constructor(public aversH: Avers.Handle) {
        this.session = new Avers.Session(aversH);
        this.ownedBoulderCollection =
            new Avers.ObjectCollection(aversH, 'ownedBoulders');
    }
}


export function
refresh(app: App): void {
    ReactDOM.render(app.mkViewFn(app), app.containerElement);
}

export function
loadView(app: App, mkViewFn: (app: App) => __React.ReactElement<any>): void {
    app.mkViewFn = mkViewFn;
    refresh(app);
}

export function
navigateTo(p : String) {
        page(p);
}

export function
navigateToFn(p: String) {
        return () => { navigateTo(p); }
}
