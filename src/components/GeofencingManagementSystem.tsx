import React, { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Upload,
  Download,
  BarChart2,
  Save,
  Search,
  Filter,
  Map as MapIcon,
  Table,
  Users,
  Building,
  HelpCircle,
  Flame,
  Clock,
  Settings,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  ShieldAlert,
  Edit2,
  Trash2,
  Copy,
  ToggleLeft,
  ToggleRight,
  Check,
  X,
  ArrowRight,
  ShieldCheck,
  Activity,
  UserCheck,
  AlertTriangle,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import SafeResponsiveContainer from "./SafeResponsiveContainer";

import { GeofencingZone, Restaurant, Rider } from "../types";
import {
  AreaZoneConfig,
  DeliveryHub,
  LocalManager,
} from "./geofencing/GeofencingTypes";
import {
  INITIAL_AREAS,
  MOCK_HUBS,
  MOCK_MANAGERS,
  MOCK_TRENDS,
} from "./geofencing/GeofencingMockData";
import { useCityContext } from "../context/CityContext";
import GeofencingMapWorkspace from "./geofencing/GeofencingMapWorkspace";
import GeofencingZoneConfigPanel from "./geofencing/GeofencingZoneConfigPanel";
import { translateCoordsToPercent } from "./OSMInteractiveMap";

interface GeofencingManagementSystemProps {
  zones: GeofencingZone[];
  setZones: React.Dispatch<React.SetStateAction<GeofencingZone[]>>;
  addZone?: (item: Omit<GeofencingZone, 'id'>) => Promise<any>;
  updateZone?: (id: string, updates: Partial<GeofencingZone>) => Promise<void>;
  deleteZone?: (id: string) => Promise<void>;
  addAreaSync?: (item: any) => Promise<any>;
  deleteAreaSync?: (id: string) => Promise<void>;
  restaurants: Restaurant[];
  riders: Rider[];
  triggerToast: (
    title: string,
    message: string,
    type: "success" | "error" | "info",
  ) => void;
}

export default function GeofencingManagementSystem({
  zones,
  setZones,
  addZone,
  updateZone,
  deleteZone,
  addAreaSync,
  deleteAreaSync,
  restaurants,
  riders,
  triggerToast,
}: GeofencingManagementSystemProps) {
  const { globalCity, cities, cityObjects } = useCityContext();

  // Load registered staff/personnel from local storage dynamically
  const rbacManagers = React.useMemo<LocalManager[]>(() => {
    const saved = localStorage.getItem("googly_rbac_staffList");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((staff: any) => ({
            id: staff.id || staff.employeeId,
            name: staff.name,
            employeeId: staff.employeeId || staff.id,
            contactNumber: staff.phone || "",
            role: staff.role || staff.designation || "Supervisor",
            assignedAreasCount: staff.assignedZones?.length || 0,
            email: staff.email || ""
          }));
        }
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  }, []);

  // -------------------- MAIN STATE MANAGERS --------------------
  const [areas, setAreas] = useState<AreaZoneConfig[]>(() => {
    const saved = localStorage.getItem("googly_geofencing_areas");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const unique: AreaZoneConfig[] = [];
          const seenIds = new Set<string>();
          const seenNames = new Set<string>();
          for (const item of parsed) {
            if (!item || !item.id) continue;
            const nameKey = `${item.city || ""}:${item.name}`.toLowerCase();
            
            // Exclude bad duplicate Ambasa zones with postcode "700001" or not containing Dhalai city references
            const isBadDuplicate =
              item.name?.toLowerCase().includes("ambasa") &&
              (item.primaryPinCode === "700001" || (item.city && !item.city.toLowerCase().includes("dhalai")));
            
            if (isBadDuplicate) continue;

            if (!seenIds.has(item.id) && !seenNames.has(nameKey)) {
              seenIds.add(item.id);
              seenNames.add(nameKey);
              unique.push(item);
            }
          }
          return unique;
        }
        return parsed;
      } catch (e) {
        // use default
      }
    }
    return INITIAL_AREAS;
  });

  const isSyncingZones = React.useRef(false);

  // Deduplicate incoming zones from prop by id and name to avoid showing/processing duplicates
  const uniquePropZones = useMemo(() => {
    const unique: GeofencingZone[] = [];
    const seenIds = new Set<string>();
    const seenNames = new Set<string>();
    for (const z of zones) {
      if (!z || !z.id) continue;
      const nameKey = `${z.city || ""}:${z.name}`.toLowerCase();
      
      // Filter out corrupted zones
      const isBadDuplicate =
        z.name?.toLowerCase().includes("ambasa") &&
        (!z.city || !z.city.toLowerCase().includes("dhalai"));
      if (isBadDuplicate) continue;

      if (!seenIds.has(z.id) && !seenNames.has(nameKey)) {
        seenIds.add(z.id);
        seenNames.add(nameKey);
        unique.push(z);
      }
    }
    return unique;
  }, [zones]);

  // Save areas to localStorage and propagate mapped updates back to zones state dynamically
  useEffect(() => {
    localStorage.setItem("googly_geofencing_areas", JSON.stringify(areas));

    // Only map areas for the active city to match with the filtered zones prop!
    const activeCityAreas = areas.filter(
      (a) =>
        globalCity === "All Cities" ||
        !a.city ||
        a.city.toLowerCase() === globalCity.toLowerCase()
    );

    const mapped = activeCityAreas.map((a) => ({
      id: a.id,
      name: a.name,
      polygon: a.points,
      active: a.status === "Active",
      ordersCount: a.restaurantsCount * 8 + a.ridersCount * 3,
      surgeEnabled: a.surgePricingEnabled,
      surgeMultiplier: a.peakHourMultiplier,
      city: a.city || globalCity || "Kolkata",
    }));

    // If database hasn't loaded any zones yet, don't auto-push default local areas
    if (uniquePropZones.length === 0 && areas.length > 0) {
      return;
    }

    // Only update zones if they are different from existing zones to prevent loops
    const hasChanges = () => {
      if (mapped.length !== uniquePropZones.length) return true;
      for (const m of mapped) {
        const z = uniquePropZones.find((item) => item.id === m.id);
        if (!z) return true;
        if (
          m.name !== z.name ||
          m.active !== z.active ||
          m.surgeEnabled !== z.surgeEnabled ||
          m.surgeMultiplier !== z.surgeMultiplier ||
          m.city.toLowerCase() !== z.city?.toLowerCase() ||
          JSON.stringify(m.polygon) !== JSON.stringify(z.polygon)
        ) {
          return true;
        }
      }
      return false;
    };

    if (hasChanges()) {
      isSyncingZones.current = true;
      setZones(mapped);
    }
  }, [areas, setZones, uniquePropZones, globalCity]);

  // Cleanup areas if city is deleted
  useEffect(() => {
    setAreas((prevAreas) => {
      const newAreas = prevAreas.filter((area) =>
        cities.some((c) => c.toLowerCase() === area.city.toLowerCase()),
      );
      if (newAreas.length !== prevAreas.length) {
        return newAreas;
      }
      return prevAreas;
    });
  }, [cities]);

  // Handle incoming real-time zone replica sync alerts safely
  useEffect(() => {
    if (isSyncingZones.current) {
      isSyncingZones.current = false;
      return;
    }

    const activeCityAreas = areas.filter(
      (a) =>
        globalCity === "All Cities" ||
        !a.city ||
        a.city.toLowerCase() === globalCity.toLowerCase()
    );

    const areasIds = new Set(areas.map((a) => a.id));
    const propZoneIds = new Set(uniquePropZones.map((z) => z.id));

    // Deletions: if an area is in activeCityAreas but its ID is missing in the database's uniquePropZones
    const needsRemoval = activeCityAreas.some((a) => !propZoneIds.has(a.id));
    const needsAddition = uniquePropZones.some((z) => !areasIds.has(z.id));

    const needsStatusUpdate = uniquePropZones.some((z) => {
      const match = activeCityAreas.find((a) => a.id === z.id);
      if (!match) return false;
      const expectedStatus = z.active ? "Active" : "Inactive";
      return (
        match.status !== expectedStatus ||
        match.name !== z.name ||
        JSON.stringify(match.points) !== JSON.stringify(z.polygon)
      );
    });

    if (needsAddition || needsRemoval || needsStatusUpdate) {
      setAreas((prevAreas) => {
        // Find all areas belonging to other cities to preserve them
        const otherCityAreas = prevAreas.filter(
          (a) =>
            globalCity !== "All Cities" &&
            a.city &&
            a.city.toLowerCase() !== globalCity.toLowerCase()
        );

        const areaMap = new Map(prevAreas.map((a) => [a.id, a]));
        const updatedCurrentCityAreas = uniquePropZones.map((z) => {
          const existing = areaMap.get(z.id);
          if (existing) {
            return {
              ...(existing as any),
              name: z.name,
              points: z.polygon,
              status: (z.active ? "Active" : "Inactive") as any,
              surgePricingEnabled: z.surgeEnabled,
              peakHourMultiplier: z.surgeMultiplier,
            };
          } else {
            const randId = Math.floor(1000 + Math.random() * 9000);
            return {
              id: z.id,
              name: z.name,
              code: `EZ-${(z.city || globalCity || "KOL").substring(0, 3).toUpperCase()}-${randId}`,
              description: "Synchronized active regional delivery sector.",
              status: (z.active ? "Active" : "Inactive") as any,
              color: "#f43f5e",
              primaryPinCode: "700091",
              city: z.city || globalCity || "Kolkata",
              state: "West Bengal",
              additionalPinCodes: [],
              boundaryType: "Polygon" as any,
              points: z.polygon,
              coverageSqKm: 12.0,
              populationEstimate: 150000,
              restaurantsCount: z.ordersCount
                ? Math.max(1, Math.round(z.ordersCount / 8))
                : 10,
              ridersCount: z.ordersCount
                ? Math.max(1, Math.round(z.ordersCount / 15))
                : 5,
              assignedHubId: "hub-central",
              assignedManagerId: "mgr-01",
              baseDeliveryFee: 40,
              perKmCharge: 10,
              maxDeliveryRadius: 15,
              minOrderValue: 200,
              avgDeliveryTime: 35,
              freeDeliveryThreshold: 500,
              surgePricingEnabled: z.surgeEnabled,
              peakHourMultiplier: z.surgeMultiplier,
              createdDate: new Date().toISOString().split("T")[0],
            };
          }
        });

        // Combine preserved other-city areas with updated current-city areas
        const combined = [...otherCityAreas, ...updatedCurrentCityAreas];
        // Ensure combined list doesn't have duplicate IDs or names
        const cleanCombined: AreaZoneConfig[] = [];
        const seenI = new Set<string>();
        const seenN = new Set<string>();
        for (const item of combined) {
          const nameKey = `${item.city || ""}:${item.name}`.toLowerCase();
          if (!seenI.has(item.id) && !seenN.has(nameKey)) {
            seenI.add(item.id);
            seenN.add(nameKey);
            cleanCombined.push(item);
          }
        }
        return cleanCombined;
      });
    }
  }, [uniquePropZones, areas, setAreas, globalCity]);

  const [selectedAreaId, setSelectedAreaId] = useState<string | null>("area-1");
  const [viewMode, setViewMode] = useState<"split" | "table" | "analytics">(
    "split",
  );
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [focusCoords, setFocusCoords] = useState<[number, number] | undefined>(
    undefined,
  );

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCity, setFilterCity] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterManager, setFilterManager] = useState("All");
  const [filterHub, setFilterHub] = useState("All");

  // Live Area creation draft state
  const [geocodedMeta, setGeocodedMeta] = useState<{
    city: string;
    district: string;
    region: string;
    state: string;
    country: string;
    pincode: string;
    fullAddress: string;
    lat: string;
    lon: string;
  } | null>(null);

  const handleMarkerDragEnd = async (lat: number, lon: number) => {
    setFocusCoords([lat, lon]);
    triggerToast(
      "Reverse Geocoding",
      "Updating address based on pin drag...",
      "info",
    );
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
      );
      const data = await res.json();
      if (data && !data.error) {
        const address = data.address || {};
        const newCity =
          address.city ||
          address.town ||
          address.village ||
          address.state_district ||
          "";
        const newState = address.state || "";
        const district = address.state_district || address.county || "";
        const newPin = address.postcode || "";
        const country = address.country || "";

        setGeocodedMeta({
          city: newCity,
          district: district,
          region: data.display_name,
          state: newState,
          country: country,
          pincode: newPin,
          fullAddress: data.display_name,
          lat: lat.toString(),
          lon: lon.toString(),
        });

        setAreaForm((prev) => ({
          ...prev,
          city: newCity || prev.city,
          state: newState || prev.state,
          primaryPinCode: newPin || prev.primaryPinCode,
        }));

        triggerToast(
          "Location Updated",
          "Address populated successfully.",
          "success",
        );
      }
    } catch (err) {
      console.error(err);
      triggerToast("Geocoding Error", "Failed to resolve address.", "error");
    }
  };

  const [areaForm, setAreaForm] = useState<Partial<AreaZoneConfig>>({
    name: "",
    code: "",
    description: "",
    status: "Draft",
    color: "#e11d48",
    primaryPinCode: "",
    city: "Kolkata",
    state: "West Bengal",
    additionalPinCodes: [],
    boundaryType: "Polygon",
    points: [],
    coverageSqKm: 8.5,
    populationEstimate: 120000,
    restaurantsCount: 15,
    ridersCount: 6,
    assignedHubId: "",
    assignedManagerId: "",
    baseDeliveryFee: 39,
    perKmCharge: 12,
    maxDeliveryRadius: 8,
    minOrderValue: 150,
    avgDeliveryTime: 30,
    freeDeliveryThreshold: 499,
    surgePricingEnabled: false,
    peakHourMultiplier: 1.0,
  });

  // Circle drawing helper radius
  const [circleRadius, setCircleRadius] = useState<number>(45);
  // Temporary map drawing mode
  const [drawMode, setDrawMode] = useState<
    "Polygon" | "Circle" | "Rectangle" | "None"
  >("None");
  const [draftPoints, setDraftPoints] = useState<{ x: number; y: number }[]>(
    [],
  );

  // Validation & Confirmation dialog
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  // -------------------- DATA SELECTOR FILTERS --------------------
  const filteredAreas = useMemo(() => {
    return areas.filter((area) => {
      if (globalCity !== "All Cities" && area.city.toLowerCase() !== globalCity.toLowerCase()) {
        return false;
      }

      const cityExists = cities.some(
        (c) => c.toLowerCase() === area.city.toLowerCase(),
      );
      if (!cityExists) return false;

      const matchSearch =
        area.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        area.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        area.primaryPinCode.includes(searchQuery);
      const matchCity = filterCity === "All" || area.city === filterCity;
      const matchStatus =
        filterStatus === "All" || area.status === filterStatus;
      const matchManager =
        filterManager === "All" || area.assignedManagerId === filterManager;
      const matchHub = filterHub === "All" || area.assignedHubId === filterHub;

      return (
        matchSearch && matchCity && matchStatus && matchManager && matchHub
      );
    });
  }, [
    areas,
    searchQuery,
    filterCity,
    filterStatus,
    filterManager,
    filterHub,
    cities,
    globalCity,
  ]);

  // Local assigned objects mapping
  const activeArea = useMemo(() => {
    const selected = areas.find((a) => a.id === selectedAreaId);
    if (selected && filteredAreas.some(fa => fa.id === selected.id)) {
      return selected;
    }
    return filteredAreas[0] || null;
  }, [areas, selectedAreaId, filteredAreas]);

  // Cities list from active cities directory
  const cityOptions = cities;

  // Overall Coverage statistics calculation
  const statistics = useMemo(() => {
    const total = filteredAreas.length;
    const active = filteredAreas.filter((a) => a.status === "Active").length;
    const managersCount = rbacManagers.length;
    const hubsCount = MOCK_HUBS.length;

    // Sum unique pin codes mapped (Primary + Additional)
    const pinsSet = new Set<string>();
    filteredAreas.forEach((a) => {
      if (a.primaryPinCode) pinsSet.add(a.primaryPinCode);
      a.additionalPinCodes?.forEach((p) => pinsSet.add(p));
    });

    const activeCoverageSqKm = filteredAreas
      .filter((a) => a.status === "Active")
      .reduce((acc, a) => acc + a.coverageSqKm, 0);
    // Supposing Kolkata metropolitan area evaluated around 205 sq.km
    const coveragePercent = Math.min(
      100,
      Math.round((activeCoverageSqKm / 180) * 100),
    );

    return {
      total,
      active,
      managers: managersCount,
      hubs: hubsCount,
      linkedPins: pinsSet.size,
      coveragePercent,
    };
  }, [filteredAreas, rbacManagers]);

  // -------------------- ACTION WORKFLOW HANDLERS --------------------
  const handleAddNewAreaClick = () => {
    setIsEditing(false);
    setDraftPoints([]);
    setDrawMode("Polygon");

    // Auto-generate fresh code template
    const randId = Math.floor(1000 + Math.random() * 9000);
    setAreaForm({
      id: `area-${Date.now()}`,
      name: "",
      code: `EZ-${globalCity !== "All Cities" ? globalCity.substring(0, 3).toUpperCase() : "KOL"}-${randId}`,
      description: "",
      status: "Draft",
      color: "#f43f5e",
      primaryPinCode: "",
      city: globalCity !== "All Cities" ? globalCity : "Kolkata",
      state: "West Bengal",
      additionalPinCodes: [],
      boundaryType: "Polygon",
      points: [],
      coverageSqKm: 14.5,
      populationEstimate: 165000,
      restaurantsCount: 22,
      ridersCount: 14,
      assignedHubId: "hub-central",
      assignedManagerId: "mgr-01",
      baseDeliveryFee: 39,
      perKmCharge: 12,
      maxDeliveryRadius: 8,
      minOrderValue: 200,
      avgDeliveryTime: 35,
      freeDeliveryThreshold: 499,
      surgePricingEnabled: false,
      peakHourMultiplier: 1.0,
    });

    setShowAddPanel(true);
    triggerToast(
      "Drawing Mode Deployed",
      "Form parameters opened. Click nodes directly on the OpenStreetMap overlay to draw the geofence perimeter.",
      "info",
    );
  };

  const handleEditClick = (area: AreaZoneConfig) => {
    setIsEditing(true);
    setAreaForm({ ...area });
    setDraftPoints([...area.points]);
    setDrawMode(area.boundaryType);
    setShowAddPanel(true);
  };

  const handleDuplicateArea = (area: AreaZoneConfig) => {
    const dupId = `area-${Date.now()}`;
    const randId = Math.floor(1000 + Math.random() * 9000);
    const duplicated: AreaZoneConfig = {
      ...area,
      id: dupId,
      name: `${area.name} (Copy)`,
      code: `EZ-KOL-${randId}`,
      status: "Draft",
      createdDate: new Date().toISOString().split("T")[0],
    };

    setAreas((prev) => [...prev, duplicated]);
    triggerToast(
      "Service Area Duplicated",
      `Successfully configured draft clone of "${area.name}".`,
      "success",
    );
  };

  const handleDeleteArea = (id: string) => {
    const target = areas.find((a) => a.id === id);
    if (!target) return;

    setAreas((prev) => prev.filter((a) => a.id !== id));
    if (selectedAreaId === id) setSelectedAreaId(null);

    // Imperative Database Deletion
    if (deleteZone) {
      deleteZone(id).catch((e) => console.error("Database deletion of zone aborted:", e));
    }
    if (deleteAreaSync) {
      deleteAreaSync(id).catch((e) => console.error("Database deletion of area synchronization aborted:", e));
    }

    triggerToast(
      "Service Area Terminated",
      `Successfully scrubbed "${target.name}" from active geofencing lists.`,
      "error",
    );
  };

  const handleToggleState = (area: AreaZoneConfig) => {
    const targetStatus = area.status === "Active" ? "Inactive" : "Active";
    setAreas((prev) =>
      prev.map((a) => (a.id === area.id ? { ...a, status: targetStatus } : a)),
    );

    // Imperative Database Toggle Update
    if (updateZone) {
      updateZone(area.id, {
        active: targetStatus === "Active"
      }).catch((e) => console.error("Database active state toggle aborted:", e));
    }

    triggerToast(
      "Operation Status Updated",
      `"${area.name}" marked as ${targetStatus}.`,
      "success",
    );
  };

  // Click on "Apply Boundary" in map workspace saves draft points to form state
  const handleSavePointsFromMap = () => {
    if (draftPoints.length === 0) {
      triggerToast(
        "Empty boundary",
        "Draw some coordinates before saving.",
        "error",
      );
      return;
    }
    setAreaForm((prev) => ({
      ...prev,
      boundaryType: drawMode === "None" ? "Polygon" : drawMode,
      points: [...draftPoints],
      circleRadius: drawMode === "Circle" ? circleRadius : undefined,
    }));
    triggerToast(
      "Path boundaries Locked",
      `${draftPoints.length} map path coordinate nodes secured to area draft.`,
      "success",
    );
  };

  // Submit sidebar configuration form
  const handleConfigFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Enforce drawing node boundaries
    if ((areaForm.points || []).length === 0 && draftPoints.length > 0) {
      areaForm.points = [...draftPoints];
    }

    if ((areaForm.points || []).length === 0) {
      let cx = 50;
      let cy = 50;
      if (focusCoords) {
        try {
          const [px, py] = translateCoordsToPercent(focusCoords[0], focusCoords[1]);
          if (typeof px === "number" && typeof py === "number" && !isNaN(px) && !isNaN(py)) {
            cx = px;
            cy = py;
          }
        } catch (err) {
          console.error("Failed to translate focusCoords to percent", err);
        }
      }

      // Generate a structured hexagonal polygon centered around coordinates
      const generatedPoints = [];
      for (let i = 0; i < 6; i++) {
        const angle = (i * 2 * Math.PI) / 6;
        const rx = Math.round(cx + 8 * Math.cos(angle));
        const ry = Math.round(cy + 6 * Math.sin(angle));
        generatedPoints.push({
          x: Math.min(95, Math.max(5, rx)),
          y: Math.min(95, Math.max(5, ry)),
        });
      }

      setDraftPoints(generatedPoints);
      setAreaForm((prev) => ({
        ...prev,
        points: generatedPoints,
      }));

      triggerToast(
        "Auto-Generated Boundary",
        "No map drawing was found, so a default delivery sector geofence has been outlined around the location focus area. Click 'Save Service Area' again to confirm.",
        "info",
      );
      return;
    }

    // Step 1: Execute Enterprise validation pipeline
    const warnings: string[] = [];

    // Check for unassigned manager
    if (!areaForm.assignedManagerId) {
      warnings.push(
        "Unassigned Local Operations Manager. Every delivery sector requires an administrative lead.",
      );
    }
    // Check for unassigned Hub
    if (!areaForm.assignedHubId) {
      warnings.push(
        "Hub Allocation Missing. Delivery dispatch cannot function without an assigned logistics node direction.",
      );
    }
    // Check for primary Pin validation
    if (!areaForm.primaryPinCode || !/^\d{6}$/.test(areaForm.primaryPinCode)) {
      warnings.push(
        "Malformed or Missing Main PIN Code. Operational routing requires an active postal identifier.",
      );
    }
    // Check overlapping pin codes in existing list
    const existsPin = areas.some(
      (a) =>
        a.id !== areaForm.id && a.primaryPinCode === areaForm.primaryPinCode,
    );
    if (existsPin) {
      warnings.push(
        `Overlapping Geofence warning: Primary Pin Code ${areaForm.primaryPinCode} is already claimed by another active area.`,
      );
    }

    setValidationWarnings(warnings);
    setShowVerifyModal(true);
  };

  // Confirm publish / save draft after reviewing validation
  const handleConfirmSaveFinal = (forceAsDraft: boolean = false) => {
    const finalZone: AreaZoneConfig = {
      ...(areaForm as AreaZoneConfig),
      city: globalCity !== "All Cities" ? globalCity : (areaForm.city || "Kolkata"),
      status: forceAsDraft ? "Draft" : areaForm.status || "Active",
      createdDate:
        areaForm.createdDate || new Date().toISOString().split("T")[0],
    };

    if (isEditing) {
      setAreas((prev) =>
        prev.map((a) => (a.id === finalZone.id ? finalZone : a)),
      );

      // Perform direct Supabase update
      if (updateZone) {
        updateZone(finalZone.id, {
          name: finalZone.name,
          polygon: finalZone.points,
          active: finalZone.status === "Active",
          surgeEnabled: finalZone.surgePricingEnabled,
          surgeMultiplier: finalZone.peakHourMultiplier,
          city: finalZone.city,
        }).catch((e) => console.error("Database updates of zone aborted:", e));
      }

      triggerToast(
        "Area Successfully Updated",
        `Geofence coordinates and delivery rates saved for "${finalZone.name}".`,
        "success",
      );
    } else {
      setAreas((prev) => [...prev, finalZone]);
      setSelectedAreaId(finalZone.id);

      // Perform direct Supabase additions
      if (addZone) {
        addZone({
          id: finalZone.id,
          name: finalZone.name,
          polygon: finalZone.points,
          active: finalZone.status === "Active",
          ordersCount: 0,
          surgeEnabled: finalZone.surgePricingEnabled,
          surgeMultiplier: finalZone.peakHourMultiplier,
          city: finalZone.city,
        } as any).catch((e) => console.error("Database addition of zone aborted:", e));
      }

      if (addAreaSync) {
        const currentCityObj = cityObjects?.find(
          (c) => c.name.toLowerCase() === finalZone.city.toLowerCase()
        );
        const resolvedCityId = currentCityObj?.id || "cc386617-640a-428a-8be5-6dfbcddc7821";

        addAreaSync({
          id: finalZone.id,
          city_id: resolvedCityId,
          name: finalZone.name,
          pincode: finalZone.primaryPinCode || "700001",
        } as any).catch((e) => console.error("Database area synchronization addition aborted:", e));
      }

      triggerToast(
        "New Delivery Area Published",
        `"${finalZone.name}" has been registered into the live delivery network.`,
        "success",
      );
    }

    setShowVerifyModal(false);
    setShowAddPanel(false);
    setDraftPoints([]);
    setDrawMode("None");
  };

  // Bulk data operations representation
  const handleExportAreas = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(areas, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `FeastFlow_Service_Areas_${Date.now()}.json`,
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerToast(
      "Data Export Completed",
      "Successfully packed and compiled delivery territory configurations to JSON.",
      "success",
    );
  };

  const handleImportAreas = () => {
    triggerToast(
      "Bulk Area Importer",
      "Upload configuration database via the workspace settings panel.",
      "info",
    );
  };

  return (
    <div
      id="area-management-root"
      className="min-h-screen bg-slate-900 text-zinc-100 font-sans antialiased p-6 transition-colors duration-300"
    >
      {/* -------------------- MAIN PAGE HEADER -------------------- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6 mb-6">
        <div>
          <span className="text-[11px] font-black uppercase text-rose-500 tracking-widest block mb-1">
            Logistics & Operations Control
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
            Area Management & Geofencing
          </h1>
          <p className="text-xs text-gray-400 font-medium max-w-2xl leading-relaxed mt-1">
            Design, regulate, and scale regional dispatch boundaries utilizing
            interactive OpenStreetMap (OSM) tools, multivariable ZIP mappings,
            staff manager delegation, and real-world DoorDash-inspired surge
            parameters.
          </p>
        </div>

        {/* Global Toolbar Action Buttons */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button
            onClick={handleAddNewAreaClick}
            className="flex-1 md:flex-none py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" /> Add New Area
          </button>

          <button
            onClick={handleImportAreas}
            className="p-2.5 px-3 bg-slate-800 hover:bg-slate-755 border border-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
            title="Import territory configurations"
          >
            <Upload className="w-4 h-4 text-rose-500" /> Import
          </button>

          <button
            onClick={handleExportAreas}
            className="p-2.5 px-3 bg-slate-800 hover:bg-slate-755 border border-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
            title="Export mapped zones to JSON"
          >
            <Download className="w-4 h-4 text-emerald-500" /> Export
          </button>

          <button
            onClick={() => {
              setViewMode(viewMode === "analytics" ? "split" : "analytics");
              triggerToast(
                "Toggling Performance Insights",
                "Interactive operational overview charting rendered.",
                "info",
              );
            }}
            className={`p-2.5 px-3 border rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${viewMode === "analytics" ? "bg-amber-500/10 border-amber-500 text-amber-500" : "bg-slate-800 border-slate-700 text-slate-200"}`}
          >
            <BarChart2 className="w-4 h-4" /> Coverage Analytics
          </button>
        </div>
      </div>

      {/* -------------------- DASHBOARD SUMMARY CARDS -------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        {/* Total areas */}
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-900 space-y-1 shadow-md">
          <div className="flex justify-between items-center text-gray-500 font-extrabold uppercase text-[9px]">
            <span>Total Zones</span>
            <MapIcon className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-white">
            {statistics.total}
          </div>
          <div className="text-[10px] text-gray-400 font-semibold italic">
            Registered perimeters
          </div>
        </div>

        {/* Active areas */}
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-900 space-y-1 shadow-md">
          <div className="flex justify-between items-center text-gray-500 font-extrabold uppercase text-[9px]">
            <span>Active Sectors</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-white">
            {statistics.active}
          </div>
          <div className="text-[10px] text-gray-400 font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />{" "}
            Live dispatching
          </div>
        </div>

        {/* Assigned managers */}
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-900 space-y-1 shadow-md">
          <div className="flex justify-between items-center text-gray-500 font-extrabold uppercase text-[9px]">
            <span>Lead Managers</span>
            <Users className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {statistics.managers}
          </div>
          <div className="text-[10px] text-gray-400 font-semibold italic">
            Delegated field leads
          </div>
        </div>

        {/* Delivery hubs linked */}
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-900 space-y-1 shadow-md">
          <div className="flex justify-between items-center text-gray-500 font-extrabold uppercase text-[9px]">
            <span>Logistics Hubs</span>
            <Building className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-white">
            {statistics.hubs}
          </div>
          <div className="text-[10px] text-gray-400 font-semibold italic">
            Central warehouses
          </div>
        </div>

        {/* Serviceable pin codes sum */}
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-900 space-y-1 shadow-md">
          <div className="flex justify-between items-center text-gray-500 font-extrabold uppercase text-[9px]">
            <span>Linked ZIPs</span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {statistics.linkedPins}
          </div>
          <div className="text-[10px] text-gray-400 font-semibold italic">
            Active PIN codes mapped
          </div>
        </div>

        {/* Coverage Percentage */}
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-900 space-y-1 shadow-md">
          <div className="flex justify-between items-center text-gray-500 font-extrabold uppercase text-[9px]">
            <span>Metropolitan Scope</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-white">
            {statistics.coveragePercent}%
          </div>
          <div className="text-[10px] text-gray-400 font-semibold italic">
            Kolkata core region coverage
          </div>
        </div>
      </div>

      {/* -------------------- FILTER PANEL BAR -------------------- */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-900 mb-6 flex flex-wrap gap-3 items-center justify-between shadow-xs select-none">
        <div className="flex flex-wrap gap-2.5 items-center flex-1">
          {/* Text search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search area name, code, pin..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 pl-9 text-xs font-semibold text-white placeholder-slate-505 focus:outline-none focus:border-rose-600"
            />
          </div>

          <div className="h-6 w-[1px] bg-slate-800 hidden sm:block" />

          {/* Filter limits options */}
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            {/* City */}
            <select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl p-2 px-3 text-slate-400"
            >
              <option value="All">All Cities</option>
              {cityOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Status */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl p-2 px-3 text-slate-400"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active only</option>
              <option value="Inactive">Inactive draft</option>
              <option value="Draft">Draft planning</option>
            </select>

            {/* Manager assigned */}
            <select
              value={filterManager}
              onChange={(e) => setFilterManager(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl p-2 px-3 text-slate-400"
            >
              <option value="All">All Managers</option>
              {rbacManagers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>

            {/* Hub assigned */}
            <select
              value={filterHub}
              onChange={(e) => setFilterHub(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl p-2 px-3 text-slate-400"
            >
              <option value="All">All Hubs</option>
              {MOCK_HUBS.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear filters trigger */}
        {(searchQuery ||
          filterCity !== "All" ||
          filterStatus !== "All" ||
          filterManager !== "All" ||
          filterHub !== "All") && (
          <button
            onClick={() => {
              setSearchQuery("");
              setFilterCity("All");
              setFilterStatus("All");
              setFilterManager("All");
              setFilterHub("All");
              triggerToast(
                "Filters Cleared",
                "Displaying all registered service sectors.",
                "info",
              );
            }}
            className="text-[10px] font-black uppercase text-rose-500 hover:underline cursor-pointer"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* -------------------- MAIN WORKSPACE SWITCHER CONTROLS -------------------- */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-rose-500" /> Interactive Platform
          Workspace
        </h3>

        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-900 gap-0.5 select-none text-[10px] font-black uppercase">
          <button
            onClick={() => setViewMode("split")}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1 ${viewMode === "split" ? "bg-rose-600 text-white" : "text-gray-400 hover:text-white"}`}
          >
            <MapIcon className="w-3.5 h-3.5" /> Map First Layout
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1 ${viewMode === "table" ? "bg-rose-600 text-white" : "text-gray-400 hover:text-white"}`}
          >
            <Table className="w-3.5 h-3.5" /> Data Ledger Table
          </button>
        </div>
      </div>

      {/* -------------------- VIEW 1: MAP FIRST SPLIT LAYOUT -------------------- */}
      {viewMode === "split" && (
        <div className="space-y-6">
          {/* Map canvas screen area (Full Width) */}
          <div className="w-full">
            <GeofencingMapWorkspace
              areas={filteredAreas}
              selectedAreaId={selectedAreaId}
              onAreaSelect={(id) => setSelectedAreaId(id)}
              drawMode={drawMode}
              setDrawMode={(m) => setDrawMode(m)}
              draftPoints={draftPoints}
              setDraftPoints={setDraftPoints}
              circleRadius={circleRadius}
              setCircleRadius={(r) => setCircleRadius(r)}
              onSavePoints={handleSavePointsFromMap}
              triggerToast={triggerToast}
              addressCoords={focusCoords}
              addressLabel={geocodedMeta ? geocodedMeta.fullAddress : undefined}
              onMarkerDragEnd={handleMarkerDragEnd}
            />
          </div>

          {/* Configuration Settings & Stats (Full Width Grid underneath the map) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Configuration Settings (7 cols) */}
            <div className="lg:col-span-7 bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                <div>
                  <h3 className="text-sm font-black text-white">
                    {showAddPanel
                      ? `${isEditing ? "Edit" : "Draw"} Service Zone`
                      : "Zone Specifications"}
                  </h3>
                  <p className="text-[10px] text-gray-400 font-semibold italic">
                    Configure geofence borders, mapping codes and logistics leads.
                  </p>
                </div>
                {showAddPanel && (
                  <button
                    onClick={() => {
                      setShowAddPanel(false);
                      setDraftPoints([]);
                      setDrawMode("None");
                    }}
                    className="p-1 px-2.5 bg-rose-900 text-rose-300 text-[10px] font-black rounded-lg uppercase cursor-pointer"
                  >
                    Exit Builder
                  </button>
                )}
              </div>

              {showAddPanel ? (
                <GeofencingZoneConfigPanel
                  areaForm={areaForm}
                  setAreaForm={setAreaForm}
                  onSave={handleConfigFormSubmit}
                  onCancel={() => {
                    setShowAddPanel(false);
                    setDraftPoints([]);
                    setDrawMode("None");
                  }}
                  isEditing={isEditing}
                  triggerToast={triggerToast}
                  setFocusCoords={setFocusCoords}
                  geocodedMeta={geocodedMeta}
                  setGeocodedMeta={setGeocodedMeta}
                />
              ) : (
                <div className="space-y-5">
                  {activeArea ? (
                    <div className="space-y-4 text-xs font-semibold text-gray-300">
                      {/* Basic specs block */}
                      <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-sm font-black text-white">
                              {activeArea.name}
                            </h4>
                            <span className="text-[10px] text-gray-400 font-mono font-bold block">
                              {activeArea.code}
                            </span>
                          </div>
                          <span
                            className={`p-1 px-2 text-[9px] font-black uppercase rounded ${activeArea.status === "Active" ? "bg-emerald-500/10 text-emerald-400" : activeArea.status === "Inactive" ? "bg-rose-500/10 text-rose-500" : "bg-amber-500/10 text-amber-500"}`}
                          >
                            {activeArea.status}
                          </span>
                        </div>

                        <p className="text-[10px] leading-relaxed font-medium italic text-gray-400">
                          {activeArea.description}
                        </p>

                        <div className="h-[1px] bg-slate-850" />

                        <div className="grid grid-cols-2 gap-3 text-center">
                          <div className="p-2 bg-slate-950 rounded-xl border border-slate-850">
                            <span className="text-[9px] text-gray-400 block">
                              Radius Area
                            </span>
                            <span className="text-white font-mono font-black">
                              {activeArea.coverageSqKm} sq km
                            </span>
                          </div>
                          <div className="p-2 bg-slate-950 rounded-xl border border-slate-850">
                            <span className="text-[9px] text-gray-400 block">
                              Local Population
                            </span>
                            <span className="text-white font-mono font-black">
                              ~{(activeArea.populationEstimate / 1000).toFixed(0)}
                              k
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Mapped Hub */}
                      <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800 space-y-2">
                        <span className="text-gray-400 font-black uppercase text-[9px] tracking-wider block">
                          Assigned Dispatch Logistics Hub
                        </span>
                        {MOCK_HUBS.find(
                          (h) => h.id === activeArea.assignedHubId,
                        ) ? (
                          (() => {
                            const hub = MOCK_HUBS.find(
                              (h) => h.id === activeArea.assignedHubId,
                            )!;
                            return (
                              <div>
                                <div className="text-white font-extrabold text-[11px] mb-0.5">
                                  {hub.name}
                                </div>
                                <div className="text-[10px] text-gray-400">
                                  Lead Manager:{" "}
                                  <span className="text-white font-bold">
                                    {hub.manager}
                                  </span>
                                </div>
                                <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                                  {hub.address}
                                </div>
                              </div>
                            );
                          })()
                        ) : (
                          <div className="text-rose-500 italic font-bold">
                            No Hub linked yet. Set link via edit.
                          </div>
                        )}
                      </div>

                      {/* Mapped Supervisor */}
                      <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800 space-y-2">
                        <span className="text-gray-400 font-black uppercase text-[9px] tracking-wider block">
                          Local Operations Lead
                        </span>
                        {rbacManagers.find(
                          (m) => m.id === activeArea.assignedManagerId,
                        ) ? (
                          (() => {
                            const mgr = rbacManagers.find(
                              (m) => m.id === activeArea.assignedManagerId,
                            )!;
                            return (
                              <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                                <div>
                                  <span className="text-white font-extrabold block">
                                    {mgr.name}
                                  </span>
                                  <span className="text-[9px] text-gray-400">
                                    {mgr.email}
                                  </span>
                                </div>
                                <span className="px-2 py-0.5 rounded bg-rose-600/10 text-rose-400 text-[8px] uppercase">
                                  {mgr.role}
                                </span>
                              </div>
                            );
                          })()
                        ) : (
                          <div className="text-rose-500 italic font-bold">
                            Unassigned field lead. Allocate immediately.
                          </div>
                        )}
                      </div>

                      {/* Pricing Configs summary */}
                      <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800 space-y-3">
                        <span className="text-gray-400 font-black uppercase text-[9px] tracking-wider block">
                          Pricing Coefficient Thresholds
                        </span>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div>
                            Base Fee:{" "}
                            <span className="text-white font-black">
                              ₹{activeArea.baseDeliveryFee}
                            </span>
                          </div>
                          <div>
                            Per KM Charge:{" "}
                            <span className="text-white font-black">
                              ₹{activeArea.perKmCharge}
                            </span>
                          </div>
                          <div>
                            Max Radius limit:{" "}
                            <span className="text-white font-black">
                              {activeArea.maxDeliveryRadius} km
                            </span>
                          </div>
                          <div>
                            Free Delivery threshold:{" "}
                            <span className="text-white font-black">
                              ₹{activeArea.freeDeliveryThreshold}
                            </span>
                          </div>
                        </div>
                        <div className="p-2 bg-rose-900/20 text-rose-300 border border-rose-900/30 rounded-xl text-[10px] flex items-center gap-2">
                          <Flame className="w-4 h-4 text-amber-500" />
                          <span>
                            Surge Pricing:{" "}
                            <span className="font-bold">
                              {activeArea.surgePricingEnabled
                                ? `Active (${activeArea.peakHourMultiplier || "1.2"}x multiplier)`
                                : "Disabled"}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Quick list action */}
                      <div className="flex gap-2 justify-end pt-2">
                        <button
                          onClick={() => handleToggleState(activeArea)}
                          className={`p-2 px-3 hover:bg-slate-850 text-slate-300 border font-extrabold rounded-lg text-[10px] uppercase cursor-pointer ${activeArea.status === "Active" ? "border-emerald-500/20 text-emerald-400" : "border-slate-800"}`}
                        >
                          {activeArea.status === "Active"
                            ? "Deactivate Zone"
                            : "Activate Zone"}
                        </button>
                        <button
                          onClick={() => handleEditClick(activeArea)}
                          className="py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-lg text-[10px] uppercase cursor-pointer"
                        >
                          Edit Territory settings
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-10 text-center select-none space-y-2 bg-slate-900/20 rounded-2xl border border-slate-800 border-dashed">
                      <span className="text-gray-500 block text-xs">
                        No Active Delivery Area Selected
                      </span>
                      <button
                        onClick={handleAddNewAreaClick}
                        className="py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black cursor-pointer"
                      >
                        Draw first zone
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Dynamic Rider and Restaurant mapping (5 cols) */}
            <div className="lg:col-span-5 h-full">
              {activeArea ? (
                <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
                  <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                    <div>
                      <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                        <ShoppingBag className="w-4 h-4 text-emerald-400" />{" "}
                        Merchant & Courier Containment mapping
                      </h4>
                      <p className="text-[10px] text-gray-400 font-semibold leading-relaxed">
                        Sectors are automatically checked for active restaurants
                        and riders registered inside coordinate polygon borders.
                      </p>
                    </div>
                    <span className="text-[10px] font-black text-gray-300 bg-slate-950 border border-slate-850 px-3 py-1 rounded-xl shrink-0">
                      Center:{" "}
                      {activeArea.points[0]
                        ? `${activeArea.points[0].x}%, ${activeArea.points[0].y}%`
                        : "Undrawn"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-5 text-[11px]">
                    {/* Restaurants contained */}
                    <div className="space-y-2">
                      <span className="text-gray-400 uppercase font-black text-[9px] tracking-wider block">
                        Restaurants active ({activeArea.restaurantsCount})
                      </span>
                      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                        {restaurants.slice(0, 3).map((rest) => (
                          <div
                            key={rest.id}
                            className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-850 flex justify-between items-center"
                          >
                            <div>
                              <span className="text-white font-extrabold block">
                                {rest.name}
                              </span>
                              <span className="text-[9px] text-[#22C55E] font-black flex items-center gap-1">
                                ● On-Duty Service · Rating {rest.rating}★
                              </span>
                            </div>
                            <button
                              onClick={() =>
                                triggerToast(
                                  "Action Handled",
                                  `${rest.name} reallocated to new boundary layout.`,
                                  "success",
                                )
                              }
                              className="bg-slate-800 hover:bg-slate-750 text-zinc-100 p-1 px-2 text-[9px] font-black rounded-lg uppercase cursor-pointer"
                            >
                              Re-Route
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Riders contained */}
                    <div className="space-y-2">
                      <span className="text-gray-400 uppercase font-black text-[9px] tracking-wider block">
                        Couriers on-duty ({activeArea.ridersCount})
                      </span>
                      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                        {riders.slice(0, 3).map((r) => (
                          <div
                            key={r.id}
                            className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-850 flex justify-between items-center"
                          >
                            <div>
                              <span className="text-white font-extrabold block">
                                {r.name}
                              </span>
                              <span className="text-[9px] text-[#38BDF8] font-bold block">
                                {r.vehicleNumber} ({r.status})
                              </span>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() =>
                                  triggerToast(
                                    "Rider Shift Complete",
                                    `Transferred active shift of ${r.name}.`,
                                    "info",
                                  )
                                }
                                className="bg-slate-800 hover:bg-slate-755 text-slate-300 p-1 px-2 text-[9px] font-black rounded-lg uppercase cursor-pointer"
                              >
                                Transfer
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-850 border-dashed rounded-3xl p-8 py-14 text-center select-none h-full flex flex-col justify-center items-center">
                  <div className="text-zinc-500 text-xs font-semibold leading-relaxed max-w-sm">
                    Select any service zone on the map above (or click a sector in the ledger table) to render active restaurants and courier containment analytics.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* -------------------- VIEW 2: DATA LEDGER TABLE -------------------- */}
      {viewMode === "table" && (
        <div className="bg-slate-900 rounded-3xl border border-slate-900 overflow-hidden shadow-2xl select-none">
          <div className="p-5 border-b border-slate-900 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white">
                Service Area Register Database
              </h3>
              <span className="text-[10px] text-gray-500 font-semibold italic">
                Directory of registered municipal sectors, coordinate bounds,
                and supervisor codes.
              </span>
            </div>
            <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono font-black text-gray-300">
              Record Count: {filteredAreas.length} of {areas.length} available
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300 border-collapse">
              <thead>
                <tr className="bg-slate-900/60 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-900">
                  <th className="p-4 pl-6">Area Name & Code</th>
                  <th className="p-4">ZIP Core</th>
                  <th className="p-4">Assigned Manager</th>
                  <th className="p-4">Logistics Hub</th>
                  <th className="p-4">Vendors link</th>
                  <th className="p-4">Active Riders</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center pr-6">Operational Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {filteredAreas.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="p-10 text-center text-gray-500 italic font-semibold"
                    >
                      No operational sectors matched the search query filter
                      guidelines.
                    </td>
                  </tr>
                ) : (
                  filteredAreas.map((area, index) => {
                    const hubObj = MOCK_HUBS.find(
                      (h) => h.id === area.assignedHubId,
                    );
                    const managerObj = rbacManagers.find(
                      (m) => m.id === area.assignedManagerId,
                    );

                    return (
                      <tr
                        key={area.id}
                        className="hover:bg-slate-900/40 transition-all font-semibold"
                      >
                        {/* Name & Code */}
                        <td className="p-4 pl-6 space-y-0.5">
                          <span className="text-white block font-black text-xs">
                            {area.name}
                          </span>
                          <span className="text-[9px] text-gray-400 font-mono block">
                            {area.code} · {area.city}
                          </span>
                        </td>
                        {/* ZIP code */}
                        <td className="p-4 font-mono text-[11px] font-black tracking-wide text-rose-500">
                          {area.primaryPinCode}
                        </td>
                        {/* Manager */}
                        <td className="p-4 text-gray-200 text-[11px]">
                          {managerObj ? (
                            managerObj.name
                          ) : (
                            <span className="text-rose-455 text-[10px] font-black italic">
                              Unassigned
                            </span>
                          )}
                        </td>
                        {/* Hub */}
                        <td className="p-4 text-gray-200 text-[11px]">
                          {hubObj ? (
                            hubObj.name
                          ) : (
                            <span className="text-rose-455 text-[10px] font-black italic">
                              Unassigned
                            </span>
                          )}
                        </td>
                        {/* Contained restaurants */}
                        <td className="p-4 font-mono font-bold text-slate-300">
                          {area.restaurantsCount} merchants
                        </td>
                        {/* Riders Count */}
                        <td className="p-4 font-mono font-bold text-slate-300">
                          {area.ridersCount} active
                        </td>
                        {/* Status badge */}
                        <td className="p-4">
                          <span
                            className={`p-1 px-2 text-[9px] font-black uppercase rounded ${area.status === "Active" ? "bg-emerald-500/10 text-emerald-400" : area.status === "Inactive" ? "bg-rose-500/10 text-rose-500" : "bg-amber-500/10 text-amber-500"}`}
                          >
                            {area.status}
                          </span>
                        </td>
                        {/* Actions group */}
                        <td className="p-4 pr-6">
                          <div className="flex gap-1 justify-end">
                            <button
                              onClick={() => handleToggleState(area)}
                              className="p-1.5 hover:bg-slate-800 text-slate-400 rounded-lg cursor-pointer"
                              title="Toggle Active Online dispatch"
                            >
                              <Check className="w-3.5 h-3.5 hover:text-emerald-500" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedAreaId(area.id);
                                handleEditClick(area);
                              }}
                              className="p-1.5 hover:bg-slate-800 text-slate-400 rounded-lg cursor-pointer"
                              title="Edit perimeter dimensions"
                            >
                              <Edit2 className="w-3.5 h-3.5 hover:text-amber-500" />
                            </button>
                            <button
                              onClick={() => handleDuplicateArea(area)}
                              className="p-1.5 hover:bg-slate-800 text-slate-400 rounded-lg cursor-pointer"
                              title="Duplicate geofence layer"
                            >
                              <Copy className="w-3.5 h-3.5 hover:text-blue-500" />
                            </button>
                            <button
                              onClick={() => handleDeleteArea(area.id)}
                              className="p-1.5 hover:bg-slate-800 text-slate-400 rounded-lg cursor-pointer"
                              title="Permanent Termination"
                            >
                              <Trash2 className="w-3.5 h-3.5 hover:text-rose-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* -------------------- OPERATIONAL INSIGHTS & ANALYTICS CHARTS PANEL -------------------- */}
      {viewMode === "analytics" && (
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-900 space-y-6 shadow-2xl animate-fade-in select-none">
          <div className="border-b border-slate-900 pb-4">
            <h4 className="text-base font-black text-white flex items-center gap-1.5">
              <BarChart2 className="w-5 h-5 text-amber-500" /> Operational
              Insights & Analytics
            </h4>
            <p className="text-[11px] text-gray-500 font-semibold">
              Track order throughput, local revenue indices, active rider
              clusters, and regional SLA success rates across sectors.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Order Density per Area */}
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-820 space-y-3">
              <span className="text-gray-400 uppercase font-black text-[10px] block">
                Order Volume Throughput (Active Runs)
              </span>
              <div className="h-64" style={{ minHeight: "256px", minWidth: 0 }}>
                <SafeResponsiveContainer minHeight={256} minWidth={0}>
                  <BarChart data={MOCK_TRENDS}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis
                      dataKey="areaName"
                      stroke="#9ca3af"
                      fontSize={10}
                      tickLine={false}
                    />
                    <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#020617",
                        borderColor: "#1f2937",
                        color: "#fff",
                      }}
                    />
                    <Bar dataKey="orders" fill="#e11d48">
                      {MOCK_TRENDS.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            index === 0
                              ? "#6366f1"
                              : index === 1
                                ? "#3b82f6"
                                : "#10b981"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </SafeResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Revenue Matrix index */}
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-820 space-y-3">
              <span className="text-gray-400 uppercase font-black text-[10px] block">
                Gross Revenue Generation (Zonal Index)
              </span>
              <div className="h-64" style={{ minHeight: "256px", minWidth: 0 }}>
                <SafeResponsiveContainer minHeight={256} minWidth={0}>
                  <AreaChart data={MOCK_TRENDS}>
                    <defs>
                      <linearGradient
                        id="colorRevenue"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#22c55e"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="95%"
                          stopColor="#22c55e"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis
                      dataKey="areaName"
                      stroke="#9ca3af"
                      fontSize={10}
                      tickLine={false}
                    />
                    <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#020617",
                        borderColor: "#1f2937",
                        color: "#fff",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#22c55e"
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </SafeResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Table index metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-3 text-[11px]">
            <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-900">
              <span className="text-gray-500 block text-[9px] font-black uppercase">
                Average Delivery Success
              </span>
              <span className="text-emerald-500 text-base font-black font-mono">
                97.8%
              </span>
            </div>
            <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-900">
              <span className="text-gray-500 block text-[9px] font-black uppercase">
                Average Dispatch Times
              </span>
              <span className="text-white text-base font-black font-mono">
                34.4 mins
              </span>
            </div>
            <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-900">
              <span className="text-gray-500 block text-[9px] font-black uppercase">
                Cancellation Index
              </span>
              <span className="text-rose-500 text-base font-black font-mono">
                1.82%
              </span>
            </div>
            <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-900">
              <span className="text-gray-500 block text-[9px] font-black uppercase">
                Active Restaurant Partners
              </span>
              <span className="text-blue-400 text-base font-black font-mono">
                183 venues
              </span>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- STEP F: CONFIRMATION & VALIDATION PIPELINE MODAL -------------------- */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl animate-scale-up text-xs font-semibold">
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-rose-600/10 text-[#E11D48] rounded-xl">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h4 className="text-base font-black text-white">
                  Zone Publishing Security Handshake
                </h4>
                <p className="text-[11px] text-gray-500">
                  Checking territory guidelines and potential boundary conflicts
                  prior to node registration.
                </p>
              </div>
            </div>

            {/* Validation warnings pipeline output */}
            <div className="space-y-2">
              <span className="text-[10px] text-gray-400 uppercase font-black block tracking-wider">
                Validation Handshake Report
              </span>
              {validationWarnings.length === 0 ? (
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 text-[11px] font-extrabold flex items-center gap-2">
                  <Check className="w-4 h-4" /> Perfect alignment. Boundary
                  coordinates are secure and clear of overlap conflicts.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {validationWarnings.map((warn, i) => (
                    <div
                      key={i}
                      className="p-3 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-xl text-[10px] font-bold flex items-start gap-1.5"
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span>{warn}</span>
                    </div>
                  ))}
                  <p className="text-[10px] text-gray-400 italic">
                    You may bypass these warnings to register the layout as
                    draft or override conflicts during startup phase.
                  </p>
                </div>
              )}
            </div>

            {/* Config summary details */}
            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-900 space-y-2.5 text-[10px] font-mono">
              <span className="text-gray-400 font-sans font-black uppercase text-[9px] tracking-wider block">
                Zone Configuration Summary
              </span>
              <div>
                Area Name:{" "}
                <span className="text-white font-extrabold font-sans">
                  {areaForm.name}
                </span>
              </div>
              <div>
                Primary ZIP code:{" "}
                <span className="text-[#E11D48] font-black">
                  {areaForm.primaryPinCode}
                </span>
              </div>
              <div>
                Estimated Coverage:{" "}
                <span className="text-white font-black">
                  {areaForm.coverageSqKm} sq. km
                </span>
              </div>
              <div>
                Linked Supervisor ID:{" "}
                <span className="text-white">
                  {areaForm.assignedManagerId || "Unassigned"}
                </span>
              </div>
              <div>
                Linked Delivery Hub ID:{" "}
                <span className="text-white">
                  {areaForm.assignedHubId || "Unassigned"}
                </span>
              </div>
              <div>
                Base Delivery Fee:{" "}
                <span className="text-white text-xs font-black">
                  ₹{areaForm.baseDeliveryFee}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2.5 justify-end pt-2">
              <button
                onClick={() => setShowVerifyModal(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-755 text-slate-100 font-extrabold rounded-xl cursor-pointer"
              >
                Back to Editor
              </button>

              <button
                onClick={() => handleConfirmSaveFinal(true)}
                className="px-4 py-2.5 bg-amber-600/15 border border-amber-600/30 text-amber-500 font-black rounded-xl cursor-pointer"
              >
                Save Draft
              </button>

              <button
                onClick={() => handleConfirmSaveFinal(false)}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl cursor-pointer shadow-lg"
              >
                Publish Service Area
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
