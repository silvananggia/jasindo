import React, { Suspense, lazy } from "react";
import { Routes, Route } from 'react-router-dom';
import Spinner from '../components/Spinner/Loading-spinner';

// Use lazy for importing your components
const MapRegister = lazy(() => import('../components/map/MapRegister'));
const MapView = lazy(() => import('../components/map/MapView'));
const MapKlaim = lazy(() => import('../components/map/MapClaim'));
const MapAnalysis = lazy(() => import('../components/map/MapAnalytic'));

function MyRouter() {
    return (
        <Routes>
            <Route path='/' element={
                <Suspense fallback={<Spinner className="content-loader" />}>
                    <MapRegister />
                </Suspense>
            } />
            <Route path='/map-view' element={
                <Suspense fallback={<Spinner className="content-loader" />}>
                    <MapView />
                </Suspense>
            } />
            <Route path='/map-klaim' element={
                <Suspense fallback={<Spinner className="content-loader" />}>
                    <MapKlaim />
                </Suspense>
            } />
            <Route path='/map-analisis' element={
                <Suspense fallback={<Spinner className="content-loader" />}>
                    <MapAnalysis />
                </Suspense>
            } />
        </Routes>
    );
}

export default MyRouter;
