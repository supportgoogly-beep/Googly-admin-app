import React, { useState } from "react";
import { 
  Maximize, Minimize, ZoomIn, ZoomOut, Compass, HelpCircle,
  Trash2, Layers, ShieldAlert, Check, RefreshCw, Eye, MapPin, 
  MousePointer, Scissors, Move, Copy, EyeOff, Search
} from "lucide-react";
import { MapPoint } from "../../types";
import { AreaZoneConfig } from "./GeofencingTypes";
import OSMInteractiveMap from "../OSMInteractiveMap";

interface GeofencingMapWorkspaceProps {
  areas: AreaZoneConfig[];
  selectedAreaId: string | null;
  onAreaSelect: (id: string) => void;
  drawMode: "Polygon" | "Circle" | "Rectangle" | "None";
  setDrawMode: (mode: "Polygon" | "Circle" | "Rectangle" | "None") => void;
  draftPoints: MapPoint[];
  setDraftPoints: React.Dispatch<React.SetStateAction<MapPoint[]>>;
  circleRadius: number;
  setCircleRadius: (r: number) => void;
  onSavePoints: () => void;
  triggerToast: (title: string, message: string, type: "success" | "error" | "info") => void;
}

export default function GeofencingMapWorkspace({
  areas,
  selectedAreaId,
  onAreaSelect,
  drawMode,
  setDrawMode,
  draftPoints,
  setDraftPoints,
  circleRadius,
  setCircleRadius,
  onSavePoints,
  triggerToast
}: GeofencingMapWorkspaceProps) {
  // Map customization states
  const [mapStyle, setMapStyle] = useState<"Satellite" | "Street" | "Dark" | "Terrain">("Street");
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchLocation, setSearchLocation] = useState("");
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measurePoints, setMeasurePoints] = useState<MapPoint[]>([]);

  // Simulation overlays
  const [showTrafficOverlay, setShowTrafficOverlay] = useState(true);
  const [showRidersOverlay, setShowRidersOverlay] = useState(true);
  const [showHubsOverlay, setShowHubsOverlay] = useState(true);

  // Measure calculation helper (simulated distances)
  const calculateDistance = (p1: MapPoint, p2: MapPoint) => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy).toFixed(2);
  };

  const calculateArea = (pts: MapPoint[]) => {
    // Basic Shoelace formula on percentage coordinates
    if (pts.length < 3) return "0.00";
    let total = 0;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      total += (pts[j].x + pts[i].x) * (pts[j].y - pts[i].y);
    }
    return Math.abs(total / 25).toFixed(2); // scaled square kilometers
  };

  // Click on map to add drawing node or measure point
  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    
    // Safety check bounds
    const newPoint: MapPoint = { x, y };

    if (isMeasuring) {
      if (measurePoints.length >= 2) {
        setMeasurePoints([newPoint]);
      } else {
        setMeasurePoints(prev => [...prev, newPoint]);
        if (measurePoints.length === 1) {
          const dist = (Math.sqrt(Math.pow(newPoint.x - measurePoints[0].x, 2) + Math.pow(newPoint.y - measurePoints[0].y, 2)) * 0.15).toFixed(2);
          triggerToast("Measurement Completed", `Distance trace is approximately ${dist} km.`, "info");
        }
      }
      return;
    }

    if (drawMode === "Polygon") {
      setDraftPoints(prev => [...prev, newPoint]);
    } else if (drawMode === "Circle") {
      // Circle takes center point and sets default radius
      setDraftPoints([newPoint]);
      setCircleRadius(45); // default base SVG radius
    } else if (drawMode === "Rectangle") {
      if (draftPoints.length === 0) {
        setDraftPoints([newPoint]);
      } else if (draftPoints.length === 1) {
        // Second point forms rectangle
        const start = draftPoints[0];
        setDraftPoints([
          start,
          { x: newPoint.x, y: start.y },
          newPoint,
          { x: start.x, y: newPoint.y }
        ]);
        triggerToast("Rectangle Defined", "Click save to apply boundary limits.", "success");
      } else {
        setDraftPoints([newPoint]);
      }
    }
  };

  // Convert points coordinates list to SVG polygon string
  const getPointsSvgPath = (pts: MapPoint[]) => {
    if (pts.length === 0) return "";
    return pts.map(p => `${p.x}%,${p.y}%`).join(" ");
  };

  const handleSearchLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchLocation) return;
    triggerToast("Searching OSM Location", `Searching coordinates mapping for "${searchLocation}"`, "info");
    // Simulate finding location by placing a temporary key center
    setSearchLocation("");
  };

  const handleDetectCurrentLocation = () => {
    triggerToast("Acquiring GPS Gateway", "Latitude 22.5726° N, Longitude 88.3639° E detected.", "success");
  };

  const activeSelectedArea = areas.find(a => a.id === selectedAreaId);

  return (
    <div className={`relative rounded-3xl overflow-hidden border transition-all ${isFullscreen ? "fixed inset-0 z-50 bg-white" : "h-[700px] bg-white border-zinc-200"}`}>
      
      {/* -------------------- FLOATING MAP CONTROLS HEADER -------------------- */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap gap-2 items-center justify-between pointer-events-none">
        
        {/* Search location bar */}
        <form onSubmit={handleSearchLocationSubmit} className="flex gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-xl border border-zinc-200 pointer-events-auto shadow-sm w-64">
          <input
            type="text"
            placeholder="Search address or pin code..."
            value={searchLocation}
            onChange={(e) => setSearchLocation(e.target.value)}
            className="bg-transparent border-none text-[10px] text-zinc-800 focus:outline-none flex-1 pl-2 font-medium placeholder-zinc-400"
          />
          <button type="submit" className="p-1 px-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] cursor-pointer">
            <Search className="w-3 h-3" />
          </button>
        </form>

        {/* Global actions like fullscreen */}
        <div className="flex gap-1 bg-white/95 backdrop-blur-md p-1 rounded-xl border border-zinc-200 pointer-events-auto shadow-sm">
          <button
            onClick={onSavePoints}
            disabled={draftPoints.length === 0}
            className={`px-2 py-1.5 rounded text-[9px] font-black uppercase tracking-wide flex items-center gap-1 transition-all ${draftPoints.length > 0 ? "bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer" : "bg-zinc-100 text-zinc-400 cursor-not-allowed"}`}
            title="Applies the active drew geofence bounds."
          >
            <Check className="w-3 h-3" /> Apply Bound
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 bg-white hover:bg-zinc-100 text-zinc-600 rounded cursor-pointer"
            title="Toggle Fullscreen Canvas"
          >
            {isFullscreen ? <Minimize className="w-3 h-3" /> : <Maximize className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* -------------------- FLOATING DRAWING TOOLBAR (LEFT SIDE) -------------------- */}
      <div className="absolute top-14 left-3 z-10 flex flex-col gap-2 select-none">
        
        {/* Draw tools container */}
        <div className="bg-white/95 backdrop-blur-md p-1.5 rounded-xl border border-zinc-200 flex flex-col gap-1.5 shadow-sm">
          <div className="text-[8px] font-black uppercase tracking-widest text-zinc-400 text-center mb-0.5">TOOLS</div>
          
          <button
            onClick={() => {
              setDrawMode("Polygon");
              setDraftPoints([]);
              setIsMeasuring(false);
              triggerToast("Polygon Drawing Tool", "Click multiple points on map, then click Apply Boundary.", "info");
            }}
            className={`p-1.5 rounded-lg flex items-center justify-center transition-all cursor-pointer ${drawMode === "Polygon" ? "bg-rose-600 text-white" : "bg-zinc-50 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100"}`}
            title="Draw Custom Polygon Route Boundaries"
          >
            <Compass className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              setDrawMode("Circle");
              setDraftPoints([]);
              setIsMeasuring(false);
              triggerToast("Circular Radius Selector", "Place center node on canvas, and adjust perimeter radius.", "info");
            }}
            className={`p-1.5 rounded-lg flex items-center justify-center transition-all cursor-pointer ${drawMode === "Circle" ? "bg-rose-600 text-white" : "bg-zinc-50 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100"}`}
            title="Draw Circular Radius Coverage"
          >
            <Maximize className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              setDrawMode("Rectangle");
              setDraftPoints([]);
              setIsMeasuring(false);
              triggerToast("Rectangle Framing Tool", "Click first corner of coverage box, and click second to seal boundary.", "info");
            }}
            className={`p-1.5 rounded-lg flex items-center justify-center transition-all cursor-pointer ${drawMode === "Rectangle" ? "bg-rose-600 text-white" : "bg-zinc-50 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100"}`}
            title="Bounding Box Rectangle Selector"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>

          <div className="h-[1px] bg-zinc-200 mx-1" />

          <button
            onClick={() => {
              setDrawMode("None");
              setIsMeasuring(!isMeasuring);
              setMeasurePoints([]);
              triggerToast(isMeasuring ? "Measuring Deactivated" : "Tape Measure Tool Injected", "Click two points on the layout canvas to test approximate aerial span.", "info");
            }}
            className={`p-1.5 rounded-lg flex items-center justify-center transition-all cursor-pointer ${isMeasuring ? "bg-amber-600 text-white" : "bg-zinc-50 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100"}`}
            title="Measure Aerial Span and Distance"
          >
            <Scissors className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              setDraftPoints([]);
              setMeasurePoints([]);
              setDrawMode("None");
              triggerToast("Geofencing Layers Purged", "Clean slate loaded.", "error");
            }}
            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-lg flex items-center justify-center transition-all cursor-pointer"
            title="Clear Draft Layers"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* GIS Diagnostic Details status */}
        <div className="bg-white/95 backdrop-blur-md p-2 rounded-xl border border-zinc-200 text-[9px] text-zinc-500 space-y-1 shadow-sm w-36 font-mono">
          <div className="font-bold text-zinc-800 text-[10px] font-sans flex items-center gap-1 pb-1 border-b border-zinc-100">
            <RefreshCw className="w-3 h-3 text-rose-500 animate-spin" /> Map Status
          </div>
          <div className="pt-1">Mode: <span className="text-zinc-800 font-bold">{drawMode !== "None" ? `Draw ${drawMode}` : isMeasuring ? "Measure" : "Standby"}</span></div>
          {draftPoints.length > 0 && (
            <>
              <div>Nodes: <span className="text-zinc-800 font-bold">{draftPoints.length}</span></div>
              {drawMode === "Polygon" && <div>Area: <span className="text-rose-600 font-bold">{calculateArea(draftPoints)} km²</span></div>}
              {drawMode === "Circle" && <div>Radius: <span className="text-rose-600 font-bold">4.8 km</span></div>}
            </>
          )}
          {isMeasuring && measurePoints.length > 0 && (
            <div>Trace: <span className="text-amber-500">{measurePoints.length}/2</span></div>
          )}
        </div>
      </div>

      {/* -------------------- MAIN INTERACTIVE CANVAS MAP WORKSPACE -------------------- */}
      <div className="w-full h-full relative" style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "center" }}>
        <OSMInteractiveMap
          mode="geofence"
          zones={areas}
          activeZoneId={selectedAreaId}
          onUpdateGeofenceBoundary={(points) => {
            setDraftPoints(points);
          }}
          triggerToast={triggerToast}
          isDarkMode={mapStyle === "Dark" || mapStyle === "Satellite" || mapStyle === "Terrain"}
          height="100%"
        />
      </div>

      {/* -------------------- BOTTOM MAP ZOOM READOUT CONTROLS -------------------- */}
      <div className="absolute bottom-4 right-4 bg-slate-950/80 backdrop-blur-md p-2 rounded-2xl border border-slate-850 flex items-center gap-2 pointer-events-auto shadow-2xl z-10 select-none">
        <button
          onClick={() => {
            setZoomLevel(prev => Math.max(50, prev - 10));
          }}
          className="p-1 px-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-white rounded-lg text-xs font-black cursor-pointer"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <span className="text-[10px] text-gray-300 font-bold font-mono px-1">{zoomLevel}%</span>
        <button
          onClick={() => {
            setZoomLevel(prev => Math.min(200, prev + 10));
          }}
          className="p-1 px-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-white rounded-lg text-xs font-black cursor-pointer"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* If an area is active, render brief floating insight statistics */}
      {activeSelectedArea && (
        <div className="absolute bottom-4 left-4 bg-slate-950/90 backdrop-blur-md p-3.5 rounded-2xl border border-slate-850 max-w-sm pointer-events-auto shadow-2xl space-y-2 animate-fade-in z-10 transition-all font-sans">
          <div className="flex justify-between items-center">
            <h5 className="text-[11px] font-black uppercase text-[#E11D48] tracking-widest flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-rose-500 animate-pulse" /> Active Coverage Overlay
            </h5>
            <span className="px-1 py-0.2 bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase rounded">
              {activeSelectedArea.status}
            </span>
          </div>
          <div>
            <h5 className="text-sm font-black text-white">{activeSelectedArea.name}</h5>
            <p className="text-[10px] text-gray-400 font-semibold italic">{activeSelectedArea.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono font-medium pt-1 text-gray-300 border-t border-slate-850">
            <div>SQ KM: <span className="text-white font-black">{activeSelectedArea.coverageSqKm}</span></div>
            <div>Min Order: <span className="text-white font-black">₹{activeSelectedArea.minOrderValue}</span></div>
            <div>Rider Count: <span className="text-white font-black">{activeSelectedArea.ridersCount} active</span></div>
            <div>Avg ETA: <span className="text-white font-black">{activeSelectedArea.avgDeliveryTime} mins</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
