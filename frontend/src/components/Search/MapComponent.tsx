'use client';

import React from 'react';
import { GoogleMap, LoadScript, Marker, Circle } from '@react-google-maps/api';

const containerStyle = {
    width: '100%',
    height: '500px'
};

const defaultCenter = {
    lat: 35.681236,
    lng: 139.767125
};

interface MapComponentProps {
    center: { lat: number; lng: number };
    results: any[];
    radius: number;
}

export default function MapComponent({ center, results, radius }: MapComponentProps) {
    // Note: In a real app, LoadScript should be at the root or handled carefully to avoid multiple loads.
    // For this simple setup, we'll put it here or wrapping the dashboard.
    // Ideally, we use useJsApiLoader hook in a parent.

    const markers = results.flatMap(group =>
        group.stores.map((store: any) => ({
            position: { lat: store.latitude, lng: store.longitude },
            title: store.name,
            icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' // Simple icon
        }))
    );

    return (
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={center || defaultCenter}
            zoom={14}
        >
            {/* Search Center Marker */}
            {center && <Marker position={center} icon="http://maps.google.com/mapfiles/ms/icons/blue-dot.png" />}

            {/* Search Radius Circle */}
            {center && (
                <Circle
                    center={center}
                    radius={radius}
                    options={{
                        strokeColor: '#FF0000',
                        strokeOpacity: 0.8,
                        strokeWeight: 2,
                        fillColor: '#FF0000',
                        fillOpacity: 0.1,
                    }}
                />
            )}

            {/* Store Markers */}
            {markers.map((marker, idx) => (
                <Marker key={idx} position={marker.position} title={marker.title} />
            ))}
        </GoogleMap>
    );
}
