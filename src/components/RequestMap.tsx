import React from "react";
import { Platform, Text, View } from "react-native";
import L from "leaflet";
import { Circle, MapContainer, Marker, TileLayer } from "react-leaflet";
import { COLORS } from "@/theme/tokens";
import type { GeoPoint } from "@/api/types";

// react-leaflet renders DOM elements, so it's web-only. We lazy-require it
// inside the web branch to avoid pulling Leaflet into a native bundle.
export function RequestMap({ geo, radiusM }: { geo: GeoPoint; radiusM: number }) {
  if (Platform.OS !== "web") {
    return (
      <View
        style={{
          height: 300,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: COLORS.surface2,
        }}
      >
        <Text style={{ color: COLORS.text3 }}>Map available on web</Text>
      </View>
    );
  }
  return <LeafletMap geo={geo} radiusM={radiusM} />;
}

function LeafletMap({ geo, radiusM }: { geo: GeoPoint; radiusM: number }) {
  const icon = L.divIcon({
    className: "",
    html: `<div style="width:20px;height:20px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${COLORS.orange};border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 20],
  });

  return (
    <MapContainer
      center={[geo.lat, geo.lng]}
      zoom={14}
      scrollWheelZoom={false}
      style={{ height: 300, width: "100%" }}
      attributionControl={false}
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
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
      <Marker position={[geo.lat, geo.lng]} icon={icon} />
    </MapContainer>
  );
}
