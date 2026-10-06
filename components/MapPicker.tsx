import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Check, MapPin, Loader2, Locate } from 'lucide-react'

// Fix for default Leaflet marker icons in Next.js
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

// Helper to handle map clicks & FlyTo animations
function LocationMarker({ position, setPosition }: { position: any, setPosition: (pos: any) => void }) {
  const map = useMap()
  
  useMapEvents({
    click(e) {
      setPosition(e.latlng)
      map.flyTo(e.latlng, map.getZoom())
    },
  })

  useEffect(() => {
    if(position) map.flyTo(position, 16) // Zoom in closer on selection
  }, [position, map])

  return position === null ? null : (
    <Marker position={position} icon={icon} />
  )
}

export default function MapPicker({ onLocationSelect, onClose }: { onLocationSelect: (data: any) => void, onClose: () => void }) {
  const [position, setPosition] = useState<any>(null) // { lat, lng }
  const [query, setQuery] = useState('')
  const [addressDetails, setAddressDetails] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Default center (London)
  const [center, setCenter] = useState({ lat: 51.505, lng: -0.09 })

  // 1. Search Logic
  const handleSearch = async () => {
    if(!query) return
    setLoading(true)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`)
      const data = await res.json()
      if(data && data.length > 0) {
        const { lat, lon } = data[0]
        const newPos = { lat: parseFloat(lat), lng: parseFloat(lon) }
        setPosition(newPos)
        // No need to setCenter, LocationMarker handles flyTo
        fetchAddressDetails(newPos.lat, newPos.lng)
      }
    } catch(e) { console.error(e) }
    setLoading(false)
  }

  // 2. Get Current Location
  const handleCurrentLocation = () => {
      setLoading(true)
      if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((pos) => {
              const { latitude, longitude } = pos.coords
              const newPos = { lat: latitude, lng: longitude }
              setPosition(newPos)
              fetchAddressDetails(latitude, longitude)
              setLoading(false)
          }, (err) => {
              console.error(err)
              setLoading(false)
              alert("Could not access your location. Please check browser permissions.")
          })
      } else {
          setLoading(false)
          alert("Geolocation is not supported by your browser")
      }
  }

  // 3. Reverse Geocode (Get Address from Lat/Lng)
  const fetchAddressDetails = async (lat: number, lng: number) => {
      try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
          const data = await res.json()
          const addr = data.address || {}
          
          setAddressDetails({
              address: data.display_name.split(',')[0],
              city: addr.city || addr.town || addr.village || addr.hamlet || 'Unknown City',
              state: addr.state || addr.county || '',
              country: addr.country || '',
              zip_code: addr.postcode || '',
              lat,
              lng
          })
      } catch(e) { console.error(e) }
  }

  // Trigger address fetch when pin moves manually
  useEffect(() => {
      if(position) fetchAddressDetails(position.lat, position.lng)
  }, [position])

  const handleConfirm = () => {
      if(addressDetails) {
          onLocationSelect(addressDetails)
      }
  }

  return (
    <div className="relative w-full h-full flex flex-col bg-zinc-100">
        
        {/* TOP SEARCH BAR */}
        <div className="absolute top-4 left-4 right-4 z-[500] flex gap-2">
            <div className="relative flex-1">
                <Input 
                    placeholder="Search city or place..." 
                    className="bg-white shadow-xl border-none h-12 text-base rounded-xl pl-4 pr-12"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
                {/* Current Location Button inside Input */}
                <button 
                    onClick={handleCurrentLocation}
                    className="absolute right-2 top-2 h-8 w-8 flex items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 transition-colors"
                    title="Use Current Location"
                >
                    <Locate className="w-4 h-4" />
                </button>
            </div>
            <Button onClick={handleSearch} className="h-12 w-12 bg-zinc-900 shadow-xl rounded-xl" size="icon">
                {loading ? <Loader2 className="w-5 h-5 animate-spin text-white"/> : <Search className="w-5 h-5"/>}
            </Button>
        </div>

        {/* MAP CONTAINER */}
        <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <LocationMarker position={position} setPosition={setPosition} />
        </MapContainer>

        {/* BOTTOM CONFIRM BAR */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-zinc-200 z-[500] flex items-center justify-between pb-6 shadow-2xl">
            <div className="flex-1 min-w-0 mr-4">
                <p className="text-[10px] text-zinc-400 font-bold uppercase mb-1 flex items-center gap-1"><MapPin className="w-3 h-3"/> Selected Location</p>
                <p className="text-sm font-bold text-zinc-900 truncate">
                    {addressDetails ? `${addressDetails.address}, ${addressDetails.city}` : "Tap on map to pin location"}
                </p>
            </div>
            <div className="flex gap-2">
                <Button variant="ghost" onClick={onClose} className="rounded-xl">Cancel</Button>
                <Button 
                    onClick={handleConfirm} 
                    disabled={!addressDetails} 
                    className="bg-zinc-900 hover:bg-black text-white gap-2 rounded-xl shadow-lg"
                >
                    <Check className="w-4 h-4"/> Confirm
                </Button>
            </div>
        </div>
    </div>
  )
}