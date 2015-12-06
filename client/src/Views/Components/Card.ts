/// <reference path="../../ext/react.d.ts" />

import * as Avers from 'avers';
import {App, refresh, navigateTo, navigateToFn} from '../../app';
import {Boulder} from '../../storage';

export interface CardProps {
    boulderE : Avers.Editable<Boulder>;
    app: App;
}

export function tileHeader(app: App, boulderId: string) {

    var colorClass = "unknown";

    let meta = Avers.lookupEditable<Boulder>(
      app.data.aversH, boulderId).fmap(boulderE => {
        var boulder = boulderE.content;
        var setters = '[';

        colorClass = boulder.grade;

        // let setterC = Avers.lookupEditable<bt.Storage.Account>(bt.data.aversH, boulder.setter[i]);
        //setterC.then(s => { setters += s + ' '; });

        setters += ']';

        var bDate = boulder.date;

        return React.DOM.div
            ( { className: 'boulder-tile-header-meta' }
            , React.DOM.div
                ( {}
                , '' + boulder.name + ' :: ' + boulder.sector)
            , React.DOM.div
                ( {}
                , bDate //bDate.getDay() + '.' + bDate.getMonth()+1 + '.' + bDate.getFullYear()
                )
            );
    }).get(undefined);

    return React.DOM.div
        ( { className: 'boulder-tile-header ' + colorClass, onClick: navigateToFn('/boulder/' + boulderId) }
        , React.DOM.div({ className: 'boulder-tile-header-indicator' })
        , React.DOM.div({ className: 'boulder-tile-header-title' }, boulderId.substring(0, 5)) //FIXME: replace Id with name
        , meta
        );
}

function tileInfo(app: App, boulderId: string) {
    //FIXME: why??
    if(boulderId === undefined)
        return;

    let info = Avers.lookupEditable<Boulder>(app.data.aversH, boulderId).fmap(boulderE => {
        var boulder = boulderE.content;

        return React.DOM.div
            ( { className: 'boulder-card-body-paragraph centered' }
            , React.DOM.div
                ( {}
                , '' + boulder.gradeNr + ' :: ' + ' [ setters ]')
            );
    }).get(undefined);

    return React.DOM.div
        ( { className: 'boulder-tile-info' }
        , info
        );
}

function tileStats(app: App, boulderId: string) {
    //FIXME: why??
    if(boulderId === undefined)
        return;

    let stats = Avers.lookupEditable<Boulder>(app.data.aversH, boulderId).fmap(boulderE => {
        var boulder = boulderE.content;

        return React.DOM.div
            ( {}
            , 'stats'
            );
    }).get(undefined);

    return React.DOM.div
        ( { className: 'boulder-tile-stats ' }
        , stats
        );
}

enum CardBody
    { Home
    }

interface CardState {
    cardBody: CardBody;
}

class CardSpec extends React.Component<CardProps, CardState> {

    private app : App;

    initialState(props: CardProps): CardState {
        // let boulder = props.boulderE.content;
        return { cardBody: CardBody.Home };
    }

    constructor(props) {
        super(props);
        this.state = this.initialState(props);
    }

    render() {
        var boulderId = this.props.boulderE.objectId;

        return React.DOM.div
            ( { className: 'boulder-card' }
            , tileHeader(this.props.app, boulderId)
            , tileInfo(this.props.app, boulderId)
            , tileStats(this.props.app, boulderId)
            );
    }
}

        //, React.DOM.div
    //        ( { className: 'button', /*onClick: mkEventF(comp, boulderId, Avers.mk(bt.Storage.Boulder, {})) */}
    //        , 'Like'
    //        )

export var Card = React.createFactory(CardSpec);
