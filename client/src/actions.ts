/*
module Actions
( createBoulder
, createCustomBoulder
) where
*/


import * as Avers from 'avers';
import * as Storage from './Storage';
import {App, navigateTo, refresh} from './app';

function mkBoulder(app: App) {
    return Avers.mk(Storage.Boulder,
        { setter : [app.data.session.objId]
        , date : new Date().toISOString()
        , removed : null
        }
    );
}

export function
createBoulder(app: App) {
    let promise = Avers.createObject(app.data.aversH, 'boulder', mkBoulder(app)).then(id => {
        app.createBoulderPromise = undefined;
        Avers.resetObjectCollection(app.data.ownedBoulderCollection);
        navigateTo('/');
        return id;
    });

    app.createBoulderPromise = promise;
    refresh(app);

    return promise;
}

export function
createCustomBoulder(app: App, boulderId: string) {
    let promise = Avers.createObjectId(app.data.aversH, boulderId, 'boulder', mkBoulder(app)).then(() => {
        app.createBoulderPromise = undefined;
        Avers.resetObjectCollection(app.data.ownedBoulderCollection);
        navigateTo('/');
        return boulderId;
    });

    app.createBoulderPromise = promise;
    refresh(app);

    return promise;
}
