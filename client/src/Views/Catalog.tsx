import * as React from 'react'
import {Catalog, pageLoader} from 'catalog'

const pages = [
    {
        path: '/',
        title: 'Welcome',
        component: pageLoader(() => import('../../README.md')),
    },
    {
        path: '/components',
        title: 'Components',
        pages: [
            {
                path: '/components/boulder-card',
                title: 'BoulderCard',
                component: pageLoader(() => import('./Components/BoulderCard.doc').then(x => x.default)),
            },
            {
                path: '/components/setter-card',
                title: 'SetterCard',
                component: pageLoader(() => import('./Components/SetterCard.doc').then(x => x.default)),
            },
        ],
    },
]

export function
catalogView() {
    return (
        <Catalog
            useBrowserHistory
            basePath='/_catalog'
            title='all-o-stasis'
            pages={pages}
        />
    )
}
