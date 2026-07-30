import React, { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from "react-router"
import MainLayout from '../layout/MainLayout'
import Skeleton from '../component/Skeleton'
const Home = lazy(() => import('../pages/Home'))
const About = lazy(() => import('../pages/About'))
const Product = lazy(() => import('../pages/Product'))
const Users = lazy(() => import('../pages/Users'))

const router = createBrowserRouter([
    {
        path: "/",
        element: <MainLayout />,
        children: [
            {
                index: true,
                element: <Suspense fallback={<div>Loading...</div>}><Home /></Suspense>
            },
            {
                path: "about",
                element: <Suspense fallback={<div>Loading...</div>}><About /></Suspense>
            },
            {
                path: "product",
                element: <Suspense fallback={<div>Loading...</div>}><Product /></Suspense>
            },
            {
                path: "users",
                element: <Suspense fallback={<div className='flex gap-4 p-4'><Skeleton /> <Skeleton /> <Skeleton /></div>}><Users /></Suspense>
            }
        ]
    },
    {
    }
])

export default router