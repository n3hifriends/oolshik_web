import React, { useMemo } from "react";
import { Platform, Text, View } from "react-native";
import L from "leaflet";
import { Circle, MapContainer, Marker, TileLayer } from "react-leaflet";
import { COLORS } from "@/theme/tokens";
import type { GeoPoint } from "@/api/types";

function isValidGeo(geo: GeoPoint) {
  return (
    Number.isFinite(geo.lat) &&
    Number.isFinite(geo.lng) &&
    geo.lat >= -90 &&
    geo.lat <= 90 &&
    geo.lng >= -180 &&
    geo.lng <= 180
  );
}

function formatRadius(radiusM: number) {
  if (!Number.isFinite(radiusM) || radiusM <= 0) return "Radius unavailable";
  if (radiusM >= 1000) return `${(radiusM / 1000).toFixed(radiusM % 1000 === 0 ? 0 : 1)} km`;
  return `${Math.round(radiusM)} m`;
}

// react-leaflet renders DOM elements, so it's web-only. We lazy-require it
// inside the web branch to avoid pulling Leaflet into a native bundle.
export function RequestMap({
  geo,
  radiusM,
  height = 360,
  showRadiusLabel = true,
}: {
  geo: GeoPoint;
  radiusM: number;
  height?: number;
  showRadiusLabel?: boolean;
}) {
  if (!isValidGeo(geo)) {
    return (
      <View
        style={{
          height,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: COLORS.surface2,
          padding: 20,
        }}
      >
        <Text style={{ color: COLORS.text3, fontWeight: "600" }}>Invalid location coordinates.</Text>
      </View>
    );
  }

  if (Platform.OS !== "web") {
    return (
      <View
        style={{
          height,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: COLORS.surface2,
        }}
      >
        <Text style={{ color: COLORS.text3 }}>Map available on web</Text>
      </View>
    );
  }
  return <LeafletMap geo={geo} radiusM={radiusM} height={height} showRadiusLabel={showRadiusLabel} />;
}

function LeafletMap({
  geo,
  radiusM,
  height,
  showRadiusLabel,
}: {
  geo: GeoPoint;
  radiusM: number;
  height: number;
  showRadiusLabel: boolean;
}) {
  const hasRadius = Number.isFinite(radiusM) && radiusM > 0;
  const icon = useMemo(
    () =>
      L.divIcon({
        className: "",
        html: `<div style="width:20px;height:20px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${COLORS.orange};border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 20],
      }),
    []
  );

  return (
    <View style={{ position: "relative", height, width: "100%", overflow: "hidden" }}>
      {showRadiusLabel && (
        <View
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            zIndex: 500,
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 8,
            backgroundColor: "rgba(255,255,255,.94)",
            borderWidth: 1,
            borderColor: COLORS.line,
          }}
        >
          <Text style={{ color: COLORS.text2, fontSize: 12.5, fontWeight: "700" }}>
            Service radius: {formatRadius(radiusM)}
          </Text>
        </View>
      )}
      <MapContainer
        center={[geo.lat, geo.lng]}
        zoom={14}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
        {hasRadius && (
          <Circle
            center={[geo.lat, geo.lng]}
            radius={radiusM}
            pathOptions={{
              color: COLORS.orange,
              weight: 1.5,
              fillColor: COLORS.orange,
              fillOpacity: 0.12,
            }}
          />
        )}
        <Marker position={[geo.lat, geo.lng]} icon={icon} />
      </MapContainer>
    </View>
  );
}
