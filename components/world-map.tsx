"use client"

import React, { useMemo, useRef, useState } from "react"
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps"
import { geoCentroid as d3GeoCentroid } from "d3-geo"

type WorldMapProps = {
  onHoverContinent?: (continent: string | null) => void
  onHoverCountry?: (countryName: string | null) => void
  onClickCountry?: (countryName: string) => void
  getArticlesForCountry?: (countryName: string) => { title: string; url: string }[]
  className?: string
}

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"

const COUNTRY_TO_CONTINENT: Record<string, string> = {
  "United States": "North America",
  Canada: "North America",
  Mexico: "North America",
  Brazil: "South America",
  Argentina: "South America",
  Colombia: "South America",
  Chile: "South America",
  Venezuela: "South America",
  Russia: "Europe",
  Germany: "Europe",
  France: "Europe",
  Italy: "Europe",
  "United Kingdom": "Europe",
  Poland: "Europe",
  Turkey: "Europe",
  China: "Asia",
  India: "Asia",
  Indonesia: "Asia",
  Pakistan: "Asia",
  Bangladesh: "Asia",
  Japan: "Asia",
  "South Korea": "Asia",
  Thailand: "Asia",
  Iran: "Middle East",
  Israel: "Middle East",
  Qatar: "Middle East",
  "Saudi Arabia": "Middle East",
  "United Arab Emirates": "Middle East",
  Nigeria: "Africa",
  Ethiopia: "Africa",
  Egypt: "Africa",
  Kenya: "Africa",
  "South Africa": "Africa",
  Algeria: "Africa",
  Australia: "Oceania",
  "New Zealand": "Oceania",
}

export function WorldMap({ onHoverContinent, onHoverCountry, onClickCountry, getArticlesForCountry, className }: WorldMapProps) {
  const continentOf = (name: string): string | null => COUNTRY_TO_CONTINENT[name] || null
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1.1)
  const [center, setCenter] = useState<[number, number]>([0, 10])
  const containerRef = useRef<HTMLDivElement>(null)
  const [overlay, setOverlay] = useState<{
    x: number
    y: number
    type: 'title' | 'list'
    country: string
    articles: { title: string; url: string }[]
  } | null>(null)

  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
  const handleZoomIn = () => setZoom((z) => clamp(z * 1.3, 0.7, 6))
  const handleZoomOut = () => setZoom((z) => clamp(z / 1.3, 0.7, 6))
  const panStep = useMemo(() => 10 / zoom, [zoom])
  const handlePan = (dx: number, dy: number) => setCenter(([lon, lat]) => [clamp(lon + dx, -180, 180), clamp(lat + dy, -85, 85)])

  return (
    <div ref={containerRef} className={className} style={{ position: 'relative' }}>
      <ComposableMap
        projection="geoMercator"
        style={{ width: "100%", height: "auto", background: "linear-gradient(180deg,#0b132b 0%, #1c2541 100%)", borderRadius: 8, touchAction: 'none' }}
      >
        <ZoomableGroup
          zoom={zoom}
          minZoom={0.7}
          maxZoom={6}
          center={center}
          onMoveEnd={(pos) => {
            if (pos && typeof pos.k === 'number') setZoom(clamp(pos.k, 0.7, 6))
            if (pos && Array.isArray(pos.coordinates)) setCenter([pos.coordinates[0], pos.coordinates[1]])
          }}
        >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const name = geo.properties.name as string
              const continent = continentOf(name)
              const articles = getArticlesForCountry ? (getArticlesForCountry(name) || []) : []
              const centroid = d3GeoCentroid(geo as any) as [number, number]
              return (
                <g key={geo.rsmKey}>
                  <Geography
                    geography={geo}
                    onMouseEnter={() => {
                      if (continent) onHoverContinent?.(continent)
                      onHoverCountry?.(name)
                    }}
                    onMouseLeave={() => {
                      onHoverContinent?.(null)
                      onHoverCountry?.(null)
                    }}
                    onClick={() => onClickCountry?.(name)}
                    style={{
                      default: { fill: "#0f3d3e", outline: "none", stroke: "#10b981", strokeWidth: 0.5 },
                      hover: { fill: "#155e63", outline: "none" },
                      pressed: { fill: "#0f3d3e", outline: "none" },
                    }}
                  />

                  {/* Article marker at centroid */}
                  {articles.length > 0 && Array.isArray(centroid) && Number.isFinite(centroid[0]) && Number.isFinite(centroid[1]) && (
                    <Marker coordinates={centroid}>
                      <g
                        onMouseEnter={(e) => {
                          setHoveredMarker(name)
                          const rect = containerRef.current?.getBoundingClientRect()
                          if (rect) {
                            setOverlay({ x: e.clientX - rect.left + 12, y: e.clientY - rect.top - 12, type: 'title', country: name, articles })
                          }
                        }}
                        onMouseMove={(e) => {
                          const rect = containerRef.current?.getBoundingClientRect()
                          if (rect && hoveredMarker === name) {
                            setOverlay((prev) => (prev ? { ...prev, x: e.clientX - rect.left + 12, y: e.clientY - rect.top - 12 } : prev))
                          }
                        }}
                        onMouseLeave={() => {
                          setHoveredMarker((v) => (v === name ? null : v))
                          setOverlay((prev) => (prev && prev.country === name ? null : prev))
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <circle r={5} fill="#16a34a" stroke="#065f46">
                          <animate attributeName="r" values="5;7;5" dur="1.8s" repeatCount="indefinite" />
                        </circle>
                        {/* count badge */}
                        {articles.length > 1 && (
                          <g
                            transform="translate(6,-10)"
                            onMouseEnter={(e) => {
                              const rect = containerRef.current?.getBoundingClientRect()
                              if (rect) {
                                setOverlay({ x: e.clientX - rect.left + 12, y: e.clientY - rect.top + 12, type: 'list', country: name, articles })
                              }
                            }}
                            onMouseMove={(e) => {
                              const rect = containerRef.current?.getBoundingClientRect()
                              if (rect) setOverlay((prev) => (prev ? { ...prev, x: e.clientX - rect.left + 12, y: e.clientY - rect.top + 12 } : prev))
                            }}
                            onMouseLeave={() => {
                              setOverlay((prev) => (prev && prev.type === 'list' && prev.country === name ? null : prev))
                            }}
                          >
                            <rect x={0} y={-8} rx={6} ry={6} width={18} height={16} fill="#10b981" />
                            <text x={9} y={3} textAnchor="middle" fill="#064e3b" fontSize={10} fontFamily="system-ui, sans-serif">{Math.min(99, articles.length)}</text>
                          </g>
                        )}
                      </g>
                    </Marker>
                  )}
                </g>
              )
            })
          }
        </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* In-map controls */}
      <div style={{ position: 'absolute', right: 12, top: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          aria-label="Zoom in"
          onClick={handleZoomIn}
          style={{ background: '#082f2a', color: '#ECFDF5', border: '1px solid #10b981', borderRadius: 8, width: 36, height: 36 }}
        >
          +
        </button>
        <button
          aria-label="Zoom out"
          onClick={handleZoomOut}
          style={{ background: '#082f2a', color: '#ECFDF5', border: '1px solid #10b981', borderRadius: 8, width: 36, height: 36 }}
        >
          −
        </button>
      </div>
      <div style={{ position: 'absolute', left: 12, top: 12, display: 'grid', gridTemplateColumns: '36px 36px 36px', gridTemplateRows: '36px 36px 36px', gap: 6, alignItems: 'center', justifyItems: 'center' }}>
        <div />
        <button aria-label="Pan up" onClick={() => handlePan(0, panStep)} style={{ background: '#082f2a', color: '#ECFDF5', border: '1px solid #10b981', borderRadius: 8, width: 36, height: 36 }}>↑</button>
        <div />
        <button aria-label="Pan left" onClick={() => handlePan(-panStep, 0)} style={{ background: '#082f2a', color: '#ECFDF5', border: '1px solid #10b981', borderRadius: 8, width: 36, height: 36 }}>←</button>
        <div />
        <button aria-label="Pan right" onClick={() => handlePan(panStep, 0)} style={{ background: '#082f2a', color: '#ECFDF5', border: '1px solid #10b981', borderRadius: 8, width: 36, height: 36 }}>→</button>
        <div />
        <button aria-label="Pan down" onClick={() => handlePan(0, -panStep)} style={{ background: '#082f2a', color: '#ECFDF5', border: '1px solid #10b981', borderRadius: 8, width: 36, height: 36 }}>↓</button>
        <div />
      </div>

      {/* HTML Overlay tooltip so it never goes behind SVG */}
      {overlay && (
        <div
          style={{
            position: 'absolute',
            left: overlay.x,
            top: overlay.y,
            zIndex: 30,
            maxWidth: 340,
            pointerEvents: overlay.type === 'list' ? 'auto' : 'none',
          }}
        >
          {overlay.type === 'title' ? (
            <div style={{ background: '#082f2a', color: '#ECFDF5', border: '1px solid #10b981', borderRadius: 10, padding: '8px 10px', boxShadow: '0 10px 28px rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
              <div style={{ fontSize: 12, lineHeight: 1.35 }}>{overlay.articles[0]?.title || ''}</div>
            </div>
          ) : (
            <div style={{ background: '#061f1c', color: '#ECFDF5', border: '1px solid #10b981', borderRadius: 12, padding: 10, boxShadow: '0 14px 32px rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}>
              <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>{overlay.country} • Articles</div>
              <div style={{ maxHeight: 240, overflow: 'auto' }}>
                {overlay.articles.slice(0, 8).map((a, i) => (
                  <div key={a.url + i} style={{ fontSize: 12, padding: '6px 4px', borderBottom: '1px solid rgba(16,185,129,0.15)', cursor: 'pointer' }} onClick={() => window.open(a.url, '_blank')}>
                    {a.title}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CyclingLabel({ articles }: { articles: { title: string; url: string }[] }) {
  const [idx, setIdx] = useState(0)
  React.useEffect(() => {
    if (!articles || articles.length === 0) return
    const id = setInterval(() => setIdx((i) => (i + 1) % articles.length), 1200)
    return () => clearInterval(id)
  }, [articles])
  const current = articles[Math.min(idx, articles.length - 1)]
  return (
    <g transform="translate(8, -8)" onClick={(e) => { e.stopPropagation(); window.open(current.url, '_blank') }} style={{ cursor: 'pointer' }}>
      <rect x={0} y={-16} rx={6} ry={6} width={260} height={32} fill="#082f2a" opacity={0.95} />
      <text x={10} y={0} fill="#ECFDF5" fontSize={11} fontFamily="system-ui, sans-serif">
        {current.title.length > 80 ? current.title.slice(0, 77) + '…' : current.title}
      </text>
    </g>
  )
}


