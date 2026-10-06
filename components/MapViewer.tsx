"use client"

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix Leaflet Icons
const iconRetinaUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png'
const iconUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png'
const shadowUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl })

function MapController({ coords }: { coords: { lat: number, lng: number } }) {
    const map = useMap()
    useEffect(() => {
        if (coords) map.flyTo(coords, 15)
    }, [coords, map])
    return null
}

export default function MapViewer({ lat, lng }: { lat: number, lng: number }) {
    if (!lat || !lng) return <div className="h-full w-full bg-zinc-100 flex items-center justify-center text-zinc-400">No Location Data</div>

    return (
        <MapContainer center={[lat, lng]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false} dragging={false} scrollWheelZoom={false}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[lat, lng]} />
            <MapController coords={{ lat, lng }} />
        </MapContainer>
    )
}