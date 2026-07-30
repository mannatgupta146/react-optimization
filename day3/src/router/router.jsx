import React from 'react'
import { createBrowserRouter, RouterProvider } from "react-router"
import MainLayout from '../layout/MainLayout'
import Home from '../pages/Home'
import About from '../pages/About'
import Product from '../pages/Product'
import Users from '../pages/Users'

const router = createBrowserRouter([
    {
        path: "/",
        element: <MainLayout />,
        children: [
            {
                index: true,
                element: <Home />
            },
            {
                path: "about",
                element: <About />
            },
            {
                path: "product",
                element: <Product />
            },
            {
                path: "users",
                element: <Users />
            }
        ]
    },
    {
    }
])

export default router