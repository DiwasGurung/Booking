'use client'

import { useState } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Loader, LocateFixed, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export interface LatLng {
  lat: number
  lng: number
}

interface Props {
  value: LatLng | null
  onChange?: (value: LatLng | null) => void
  readOnly?: boolean
  height?: number
}

const KATHMANDU: LatLng = { lat: 27.7172, lng: 85.324 }
const round = (n: number) => Math.round(n * 1e6) / 1e6

// divIcon avoids Leaflet's broken default marker image paths under bundlers
const pinIcon = L.divIcon({
  className: '',
  iconSize: [32, 40],
  iconAnchor: [16, 40],
  html: `<svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 0C7.2 0 0 7 0 15.7 0 27 16 40 16 40s16-13 16-24.3C32 7 24.8 0 16 0z" fill="#dc2626"/>
    <circle cx="16" cy="15.5" r="6" fill="#fff"/>
  </svg>`,
})

function ClickToPlace({ onPick }: { onPick: (p: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: round(e.latlng.lat), lng: round(e.latlng.lng) })
    },
  })
  return null
}

function FlyTo({ target }: { target: LatLng | null }) {
  const map = useMap()
  if (target) map.setView([target.lat, target.lng], Math.max(map.getZoom(), 16))
  return null
}

export default function LocationPicker({ value, onChange, readOnly = false, height = 320 }: Props) {
  const [focus, setFocus] = useState<LatLng | null>(null)
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState<'search' | 'geo' | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const pick = (p: LatLng, fly = false) => {
    onChange?.(p)
    if (fly) setFocus({ ...p })
    setMessage(null)
  }

  const handleSearch = async () => {
    if (!query.trim()) return
    try {
      setBusy('search')
      setMessage(null)
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=np&q=${encodeURIComponent(query.trim())}`
      )
      const data = await res.json()
      if (!Array.isArray(data) || data.length === 0) {
        setMessage('No match found. Try a nearby landmark, or click the map directly.')
        return
      }
      pick({ lat: round(Number(data[0].lat)), lng: round(Number(data[0].lon)) }, true)
    } catch {
      setMessage('Search failed. You can still click the map to place the pin.')
    } finally {
      setBusy(null)
    }
  }

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setMessage('Your browser does not support location access.')
      return
    }
    setBusy('geo')
    setMessage(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        pick({ lat: round(pos.coords.latitude), lng: round(pos.coords.longitude) }, true)
        setBusy(null)
      },
      () => {
        setMessage('Could not get your location. Check browser permissions.')
        setBusy(null)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div className="space-y-3">
      {!readOnly && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex flex-1 gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleSearch()
                }
              }}
              placeholder="Search a place, e.g. Thamel, Kathmandu"
            />
            <Button type="button" variant="outline" onClick={handleSearch} disabled={busy !== null}>
              {busy === 'search' ? <Loader className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
          <Button type="button" variant="outline" onClick={handleLocate} disabled={busy !== null} className="gap-2">
            {busy === 'geo' ? <Loader className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
            Use my location
          </Button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border" style={{ height }}>
        <MapContainer
          center={value ? [value.lat, value.lng] : [KATHMANDU.lat, KATHMANDU.lng]}
          zoom={value ? 16 : 12}
          scrollWheelZoom={!readOnly}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {!readOnly && <ClickToPlace onPick={(p) => pick(p)} />}
          <FlyTo target={focus} />
          {value && (
            <Marker
              position={[value.lat, value.lng]}
              icon={pinIcon}
              draggable={!readOnly}
              eventHandlers={{
                dragend(e) {
                  const ll = (e.target as L.Marker).getLatLng()
                  pick({ lat: round(ll.lat), lng: round(ll.lng) })
                },
              }}
            />
          )}
        </MapContainer>
      </div>

      {!readOnly && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {value
              ? `Pin set at ${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}. Drag the pin to fine-tune.`
              : 'Search, use your location, or click the map to drop a pin on your business.'}
          </p>
          {value && (
            <button
              type="button"
              onClick={() => onChange?.(null)}
              className="inline-flex items-center gap-1 text-xs text-destructive hover:underline"
            >
              <X className="h-3 w-3" /> Remove pin
            </button>
          )}
        </div>
      )}
      {message && <p className="text-xs text-destructive">{message}</p>}
    </div>
  )
}