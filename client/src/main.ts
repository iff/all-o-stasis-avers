import page from 'page'

import * as Avers from 'avers'
import {Data, App, config, infoTable, refresh, loadView} from './app'

import {loadingView, notFoundView} from './views'
import {accountView} from './Views/Account'
import {boulderView} from './Views/Boulder'
import {homeView} from './Views/Home'
import {loginView} from './Views/Login'
import {sectorView} from './Views/Sector'
import {teamView} from './Views/Team'
import {catalogView} from './Views/Catalog'
import {emailConfirmedView} from './Views/EmailConfirmed'
import {statsView} from './Views/Stats'

const mkApp = (): App => {
    const aversH = new Avers.Handle({
        apiHost: config.apiHost,
        fetch: window.fetch.bind(window),
        createWebSocket: path => new WebSocket('ws:' + config.apiHost + path),
        now: window.performance.now.bind(window.performance),
        infoTable,
    })

    const data = new Data(aversH)

    const containerElement = document.getElementById('root')
    if (!containerElement) {
        throw new Error('mkApp: #root not found')
    }

    return new App(
        containerElement,
        data,
        loadingView,
    )
}

const main = () => {
    // console.info('Starting app...')

    // Create the application instance. Pass all required configuration to the
    // constructor.
    const app = mkApp()

    // Attach a listener to watch for changes. Refresh the application UI
    // when any change happens. This is the main rendering loop of the
    // application. The 'console.info' shows you how frequently the application
    // data changes.
    Avers.attachGenerationListener(app.data.aversH, () => {
        // console.info('Generation', app.data.aversH.generationNumber)
        refresh(app)
    })

    // This template uses page.js for the router. If you target modern browsers
    // you may get away with a more straightforward implementation and listen
    // to the hashchange events directly.
    setupRoutes(app)

    // The app template makes use of the Avers Session. First thing we try to
    // do is to restore an existing session. The views will use the information
    // that is stored in the session object to determine what to show.
    Avers.restoreSession(app.data.session)

    // Expose some useful tools on 'window' to make them easily accessible from
    // the developer console. This part is entirely optional, though
    // I recommend to keep it even in production. It doesn't add any significant
    // overhead and gives you easy access to the application state.
    const windowAny = window as any
    windowAny.Avers = Avers
    windowAny.app = app
}


function setupRoutes(app: App) {
    page('/', () => {
        loadView(app, homeView)
    })

    page('/login', () => {
        loadView(app, loginView())
    })

    page('/sector', () => {
        loadView(app, sectorView)
    })

    page('/stats', () => {
        loadView(app, statsView)
    })

    page('/boulder/:boulderId', ctx => {
        loadView(app, boulderView(ctx.params.boulderId))
    })

    page('/account/:accountId', ctx => {
        loadView(app, accountView(ctx.params.accountId))
    })

    page('/team', () => {
        loadView(app, teamView)
    })

    page('/email-confirmed', () => {
        loadView(app, emailConfirmedView)
    })

    page('/_catalog', () => {
        loadView(app, catalogView)
    })
    page('/_catalog/*', () => {
        loadView(app, catalogView)
    })

    page('/loading', () => {
        loadView(app, loadingView)
    })

    page('*', () => {
        loadView(app, notFoundView)
    })

    page()
}

main()
