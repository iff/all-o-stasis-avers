/// <reference path="./env/config.d.ts" />

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


import * as Avers from 'avers';
import {Account, Boulder} from './storage';

declare var page;

export class App {

    createBoulderPromise : Promise<string> = undefined;

    constructor
      ( public data     : Data
      , public mkViewFn : (app: App) => any
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
    React.render(app.mkViewFn(app), document.body);
}

export function
loadView(app: App, mkViewFn: (app: App) => React.ReactElement<any>): void {
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
