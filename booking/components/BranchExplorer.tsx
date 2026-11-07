'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { MapPin, Phone, CalendarCheck, ArrowUpRight, Clock } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import { OpenStatus } from '@/components/OpenStatus'
import { HoursTable } from '@/components/HoursTable'

interface BranchHour {
    dayOfWeek: number
    openTime: string
    closeTime: string
    isClosed: boolean
}

export interface BranchItem {
    id: string
    name: string
    address: string
    city: string
    phone?: string | null
    isMain: boolean
    lat: number | null
    lng: number | null
    directionsHref?: string
    bookHref: string
    hours: BranchHour[]
}

interface Props {
    branches: BranchItem[]
    /** next/font className for headings so the panel matches the page */
    headingClassName?: string
}

const PIN_PATH =
    'M12 2C7.6 2 4 5.5 4 9.9c0 5.6 6.4 11.4 7.3 12.2.4.4 1 .4 1.4 0C13.6 21.3 20 15.5 20 9.9 20 5.5 16.4 2 12 2z'

// Pin drawn as inline SVG so there are no marker image files to break in the bundler.
function makeIcon(L: any, active: boolean) {
    const size = active ? 44 : 34
    return L.divIcon({
        className: 'branch-pin',
        html: `<div class="text-primary"><svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"><path d="${PIN_PATH}"/><circle cx="12" cy="10" r="3" fill="#fff" stroke="none"/></svg></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size],
    })
}

const MAP_CSS = `
.branch-map .leaflet-container{font:inherit;background:#eef0f1;outline:none}
.branch-map .leaflet-control-zoom{border:0!important;border-radius:12px;overflow:hidden;box-shadow:0 2px 10px rgb(0 0 0 / .18)}
.branch-map .leaflet-control-zoom a{width:34px;height:34px;line-height:34px;color:#111;border-bottom:1px solid #e5e5e5}
.branch-map .leaflet-control-zoom a:last-child{border-bottom:0}
.branch-map .leaflet-control-attribution{font-size:10px;background:rgba(255,255,255,.75);border-top-left-radius:8px}
.branch-pin{background:transparent;border:0}
.branch-pin svg{display:block;filter:drop-shadow(0 3px 4px rgb(0 0 0 / .35))}
`

export function BranchExplorer({ branches, headingClassName = '' }: Props) {
    const [selectedId, setSelectedId] = useState<string | undefined>(
        () => (branches.find((b) => b.isMain) ?? branches[0])?.id
    )
    const selected = branches.find((b) => b.id === selectedId) ?? branches[0]

    const mapEl = useRef<HTMLDivElement>(null)
    const mapRef = useRef<any>(null)
    const leafletRef = useRef<any>(null)
    const markersRef = useRef<Record<string, any>>({})
    const firstSync = useRef(true)
    const [ready, setReady] = useState(false)

    const pinned = useMemo(() => branches.filter((b) => b.lat !== null && b.lng !== null), [branches])

    // Create the map once (client only; Leaflet is loaded lazily so SSR never touches it)
    useEffect(() => {
        if (pinned.length === 0) return
        let cancelled = false
        let map: any

        ;(async () => {
            const L = (await import('leaflet')).default as any
            if (cancelled || !mapEl.current) return

            leafletRef.current = L
            map = L.map(mapEl.current, {
                zoomControl: false,
                scrollWheelZoom: false, // don't hijack page scrolling
                dragging: !L.Browser.mobile, // one-finger scroll on phones stays page scroll
            })
            L.control.zoom({ position: 'bottomright' }).addTo(map)
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; OpenStreetMap contributors',
            }).addTo(map)

            pinned.forEach((b) => {
                const marker = L.marker([b.lat, b.lng], { icon: makeIcon(L, false), title: b.name })
                    .addTo(map)
                    .bindTooltip(b.name, { direction: 'top', offset: [0, -30] })
                    .on('click', () => setSelectedId(b.id))
                markersRef.current[b.id] = marker
            })

            if (pinned.length === 1) {
                map.setView([pinned[0].lat, pinned[0].lng], 16)
            } else {
                map.fitBounds(L.latLngBounds(pinned.map((b) => [b.lat, b.lng])), { padding: [48, 48], maxZoom: 16 })
            }

            mapRef.current = map
            setReady(true)
        })()

        return () => {
            cancelled = true
            map?.remove()
            mapRef.current = null
            markersRef.current = {}
            firstSync.current = true
            setReady(false)
        }
    }, [pinned])

    // Highlight the selected pin and glide to it (not on first load, which shows every branch)
    useEffect(() => {
        const L = leafletRef.current
        const map = mapRef.current
        if (!ready || !L || !map) return

        Object.entries(markersRef.current).forEach(([id, marker]) => {
            const active = id === selectedId
            marker.setIcon(makeIcon(L, active))
            marker.setZIndexOffset(active ? 1000 : 0)
        })

        if (firstSync.current) {
            firstSync.current = false
            return
        }

        const b = pinned.find((p) => p.id === selectedId)
        if (!b) return
        const zoom = Math.max(map.getZoom(), 15)
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            map.setView([b.lat, b.lng], zoom, { animate: false })
        } else {
            map.flyTo([b.lat, b.lng], zoom, { duration: 0.7 })
        }
    }, [selectedId, ready, pinned])

    if (!selected) return null

    return (
        <div>
            <style>{MAP_CSS}</style>

            {/* Branch picker */}
            <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Choose a branch">
                {branches.map((b) => {
                    const active = b.id === selected.id
                    return (
                        <button
                            key={b.id}
                            type="button"
                            aria-pressed={active}
                            onClick={() => setSelectedId(b.id)}
                            className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
                                active
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                            }`}
                        >
                            {b.name}
                        </button>
                    )
                })}
            </div>

            {/* One shared map. `isolate` keeps Leaflet's high z-indexes inside this box,
                so the map can no longer paint over the sticky header and tabs. */}
            {pinned.length > 0 && (
                <div
                    className="branch-map relative z-0 overflow-hidden rounded-2xl border border-border"
                    style={{ isolation: 'isolate' }}
                >
                    <div ref={mapEl} className="h-72 w-full sm:h-80" role="region" aria-label="Map of branch locations" />
                </div>
            )}

            {/* Selected branch details */}
            <div key={selected.id} className="mt-5 grid gap-6 sm:grid-cols-2" aria-live="polite">
                <div className="min-w-0 space-y-3">
                    <h3 className={`${headingClassName} text-lg font-medium text-foreground`}>
                        {selected.name}
                        {selected.isMain && (
                            <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 align-middle font-sans text-xs font-medium text-primary">
                                Main
                            </span>
                        )}
                    </h3>

                    {selected.hours.length > 0 && (
                        <div className="text-sm">
                            <OpenStatus hours={selected.hours} />
                        </div>
                    )}

                    {(selected.address || selected.city) && (
                        <p className="flex items-start gap-2 text-sm text-muted-foreground">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            {[selected.address, selected.city].filter(Boolean).join(', ')}
                        </p>
                    )}

                    {selected.phone && (
                        <a
                            href={`tel:${selected.phone}`}
                            className="flex items-center gap-2 text-sm text-foreground transition-colors hover:text-primary"
                        >
                            <Phone className="h-4 w-4 shrink-0 text-primary" />
                            {selected.phone}
                        </a>
                    )}

                    <div className="flex flex-wrap gap-2 pt-1">
                        <Link
                            href={selected.bookHref}
                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                        >
                            <CalendarCheck className="h-4 w-4" />
                            Book here
                        </Link>
                        {selected.directionsHref && (
                            <a
                                href={selected.directionsHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:text-primary"
                            >
                                Directions
                                <ArrowUpRight className="h-3.5 w-3.5" />
                            </a>
                        )}
                    </div>
                </div>

                {selected.hours.length > 0 && (
                    <div className="min-w-0">
                        <p className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                            <Clock className="h-4 w-4" />
                            Hours
                        </p>
                        <HoursTable hours={selected.hours} />
                    </div>
                )}
            </div>
        </div>
    )
}