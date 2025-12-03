'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import { GoogleMap, Marker, Circle, InfoWindow } from '@react-google-maps/api';

const containerStyle = {
    width: '100%',
    height: '500px'
};

const defaultCenter = {
    lat: 35.681236,
    lng: 139.767125
};

interface Store {
    name: string;
    latitude?: number;
    longitude?: number;
    vicinity?: string;
    distance_m?: number;
    place_id?: string;
}

interface MapComponentProps {
    center: { lat: number; lng: number };
    results: any[];
    radius: number;
    selectedStore: {
        name: string;
        latitude: number;
        longitude: number;
        vicinity?: string;
        distance_m?: number;
        place_id?: string;
    } | null;
    onMarkerClick: (store: Store | null) => void;
}

/**
 * マップコンポーネント
 * - 検索結果の店舗をマーカーで表示
 * - マーカークリックで店舗情報を表示
 * - 選択された店舗をハイライト表示
 */
export default function MapComponent({ center, results, radius, selectedStore, onMarkerClick }: MapComponentProps) {
    const mapRef = useRef<google.maps.Map | null>(null);

    // 全店舗のマーカー情報を生成（一意のキーも含める）
    const markers = useMemo(() => {
        return results.flatMap((group, groupIdx) =>
            group.stores
                .filter((store: Store) => store.latitude && store.longitude)
                .map((store: Store, storeIdx: number) => ({
                    id: `${groupIdx}-${storeIdx}-${store.place_id || `${store.latitude}-${store.longitude}`}`,
                    position: { lat: store.latitude!, lng: store.longitude! },
                    title: store.name,
                    store: store,
                    isSelected: selectedStore && 
                        store.latitude === selectedStore.latitude && 
                        store.longitude === selectedStore.longitude
                }))
        );
    }, [results, selectedStore]);

    // 選択された店舗が変更されたら、マップの中心をその店舗に移動
    useEffect(() => {
        if (selectedStore && mapRef.current) {
            mapRef.current.panTo({
                lat: selectedStore.latitude,
                lng: selectedStore.longitude,
            });
        }
    }, [selectedStore]);

    return (
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={center || defaultCenter}
            zoom={14}
            onLoad={(map) => {
                mapRef.current = map;
            }}
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
            {markers.map((marker) => (
                <React.Fragment key={marker.id}>
                    <Marker
                        position={marker.position}
                        title={marker.title}
                        icon={
                            marker.isSelected
                                ? 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
                                : 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
                        }
                        onClick={() => onMarkerClick(marker.store)}
                        animation={marker.isSelected ? (window as any).google?.maps?.Animation?.BOUNCE : undefined}
                    />
                    {marker.isSelected && (
                        <InfoWindow
                            position={marker.position}
                            onCloseClick={() => onMarkerClick(null)}
                        >
                            <div style={{ padding: '8px' }}>
                                <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold' }}>
                                    {marker.store.name}
                                </h3>
                                {marker.store.vicinity && (
                                    <p style={{ margin: '4px 0', fontSize: '14px', color: '#666' }}>
                                        {marker.store.vicinity}
                                    </p>
                                )}
                                {marker.store.distance_m !== undefined && (
                                    <p style={{ margin: '4px 0', fontSize: '14px', color: '#666' }}>
                                        距離: {marker.store.distance_m}m
                                    </p>
                                )}
                            </div>
                        </InfoWindow>
                    )}
                </React.Fragment>
            ))}
        </GoogleMap>
    );
}
