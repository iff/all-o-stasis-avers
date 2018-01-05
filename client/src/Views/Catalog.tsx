import * as React from 'react'
import Loadable from 'react-loadable'

const LoadableCatalog = Loadable({
    loader: () => import('catalog'),
    render({Catalog, pageLoader}) {
        const pages = [
            {
                path: '/',
                title: 'Welcome',
                component: pageLoader(() => import('../../README.md')),
            },
            {
                path: '/materials',
                title: 'Materials',
                pages: [
                    {
                        path: '/materials/colors',
                        title: 'Colors',
                        component: pageLoader(() => import('../Materials/Colors.doc')),
                    },
                    {
                        path: '/materials/typfaces',
                        title: 'Typefaces',
                        component: pageLoader(() => import('../Materials/Typefaces.doc')),
                    },
                ],
            },
            {
                path: '/components',
                title: 'Components',
                pages: [
                    {
                        path: '/components/boulder-id',
                        title: 'BoulderId',
                        component: pageLoader(() => import('./Components/BoulderId.doc').then(x => x.default)),
                    },
                    {
                        path: '/components/boulder-card',
                        title: 'BoulderCard',
                        component: pageLoader(() => import('./Components/BoulderCard.doc').then(x => x.default)),
                    },
                    {
                        path: '/components/boulder-details',
                        title: 'BoulderDetails',
                        component: pageLoader(() => import('./Components/BoulderDetails.doc').then(x => x.default)),
                    },
                    {
                        path: '/components/setter-card',
                        title: 'SetterCard',
                        component: pageLoader(() => import('./Components/SetterCard.doc').then(x => x.default)),
                    },
                    {
                        path: '/components/sector-picker',
                        title: 'SectorPicker',
                        component: pageLoader(() => import('./Components/SectorPicker.doc').then(x => x.default)),
                    },
                    {
                        path: '/components/login',
                        title: 'Login',
                        component: pageLoader(() => import('./Login.doc').then(x => x.default)),
                    },
                    {
                        path: '/components/stats',
                        title: 'Stats',
                        component: pageLoader(() => import('./Components/Stats/Visualization.doc').then(x => x.default)),
                    },
                ],
            },
        ]

        return (
            <Catalog
                useBrowserHistory
                basePath='/_catalog'
                title='all-o-stasis'
                pages={pages}
            />
        )
    },
    loading: () => <div />,
})

export function
catalogView() {
    return <LoadableCatalog />
}
