import React, { useEffect, useState } from "react";
import { MapContainer, Marker, TileLayer, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import axios from "axios";
import { serverUrl } from "../App";
import { useSocket } from "../context/SocketContext";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const deliveryBoyIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const customerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, 14);
    }
  }, [center, map]);
  return null;
}

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(2);
};

export default function DeliveryBoyTracking({ data, customerId, onDelivered }) {
  const [orderStatus, setOrderStatus] = useState(data?.shopOrder?.status || "Out Of Delivery");
  const [deliveryBoyLocation, setDeliveryBoyLocation] = useState({
    lat: data?.deliveryBoyLocation?.lat || 0,
    lon: data?.deliveryBoyLocation?.lon || 0,
  });
  const [updating, setUpdating] = useState(false);

  const socketRef = useSocket();

  const customerLocation = {
    lat: data?.customerLocation?.lat || data?.deliveryAddress?.latitude || 0,
    lon: data?.customerLocation?.lon || data?.deliveryAddress?.longitude || 0,
  };

  const distance = calculateDistance(
    deliveryBoyLocation.lat,
    deliveryBoyLocation.lon,
    customerLocation.lat,
    customerLocation.lon,
  );

  // Push live GPS to the customer via socket every 5 seconds.
  useEffect(() => {
    if (!navigator.geolocation || orderStatus === "delivered") return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setDeliveryBoyLocation({ lat, lon });
        if (socketRef?.current && customerId) {
          socketRef.current.emit("delivery:location", { customerId, lat, lon });
        }
      },
      (err) => console.log("GPS error:", err),
      { enableHighAccuracy: true, maximumAge: 0 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [customerId, socketRef?.current, orderStatus]);

  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true);
    try {
      await axios.put(
        `${serverUrl}/api/order/update-status/${data._id}/${data.shopOrder.shop._id}`,
        { status: newStatus },
        { withCredentials: true },
      );
      setOrderStatus(newStatus);

      // When delivered: stop tracking and tell the parent to clear the current order.
      if (newStatus === "delivered") {
        setTimeout(() => {
          if (onDelivered) onDelivered();
        }, 3000); // Show the success screen for 3 seconds before clearing.
      }
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setUpdating(false);
    }
  };

  const [routeLine, setRouteLine] = useState([]);
  const timeoutRef = React.useRef(null);

  useEffect(() => {
    if (deliveryBoyLocation.lat === 0 || customerLocation.lat === 0) return;

    if (timeoutRef.current) return;

    timeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${deliveryBoyLocation.lon},${deliveryBoyLocation.lat};${customerLocation.lon},${customerLocation.lat}?overview=full&geometries=geojson`
        );
        const data = await response.json();
        
        if (data.code === "Ok") {
          const coords = data.routes[0].geometry.coordinates.map(
            ([lon, lat]) => [lat, lon]
          );
          setRouteLine(coords);
        } else {
          setRouteLine([
            [deliveryBoyLocation.lat, deliveryBoyLocation.lon],
            [customerLocation.lat, customerLocation.lon],
          ]);
        }
      } catch (error) {
        setRouteLine([
          [deliveryBoyLocation.lat, deliveryBoyLocation.lon],
          [customerLocation.lat, customerLocation.lon],
        ]);
        console.error("Error fetching route:", error);
      } finally {
        timeoutRef.current = null;
      }
    }, 1500);

  }, [deliveryBoyLocation.lat, deliveryBoyLocation.lon, customerLocation.lat, customerLocation.lon]);

  // ─── Delivery complete screen ─────────────────────────────────────────────
  if (orderStatus === "delivered") {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <span className="text-4xl">✅</span>
        </div>
        <h3 className="text-xl font-bold text-green-700">Order Delivered!</h3>
        <p className="text-gray-500 text-sm">
          Great job! The customer has been notified. You are now free for new deliveries.
        </p>
        <div className="text-xs text-gray-400 flex items-center gap-1">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse inline-block"></span>
          Returning to dashboard...
        </div>
      </div>
    );
  }

  const mapCenter = [
    (deliveryBoyLocation.lat + customerLocation.lat) / 2 || 0,
    (deliveryBoyLocation.lon + customerLocation.lon) / 2 || 0,
  ];



  const validMap =
    deliveryBoyLocation.lat !== 0 ||
    deliveryBoyLocation.lon !== 0 ||
    customerLocation.lat !== 0 ||
    customerLocation.lon !== 0;

  return (
    <div className="space-y-4">
      {/* Status Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleStatusUpdate("picked")}
          disabled={updating || orderStatus === "picked" || orderStatus === "delivered"}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            orderStatus === "picked"
              ? "bg-green-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {orderStatus === "picked" ? "✓ Picked Up" : "Mark as Picked"}
        </button>

        <button
          onClick={() => handleStatusUpdate("delivered")}
          disabled={updating || orderStatus !== "picked"}
          className="px-4 py-2 rounded-lg font-medium bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {updating ? "Updating..." : "Mark as Delivered"}
        </button>
      </div>

      {/* Distance & Status */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm font-semibold text-blue-800">
          📍 Distance to Customer: <span className="text-lg">{distance} km</span>
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Status: <span className="font-semibold uppercase">{orderStatus}</span>
        </p>
        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse inline-block"></span>
          Streaming live location to customer
        </p>
      </div>

      {/* Map */}
      {validMap && (
        <div className="rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg">
          <MapContainer
            center={mapCenter}
            zoom={14}
            style={{ height: "400px", width: "100%" }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapUpdater center={mapCenter} />
            <Marker position={[deliveryBoyLocation.lat, deliveryBoyLocation.lon]} icon={deliveryBoyIcon} />
            <Marker position={[customerLocation.lat, customerLocation.lon]} icon={customerIcon} />
            {routeLine.length > 0 && (
              <Polyline 
                positions={routeLine} 
                color="blue" 
                weight={4} 
                opacity={0.8} 
                dashArray={routeLine.length === 2 ? "10, 10" : ""} 
              />
            )}
          </MapContainer>
        </div>
      )}

      {!validMap && (
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-6 text-center">
          <p className="text-gray-500 text-sm">📡 Acquiring GPS coordinates...</p>
        </div>
      )}

      {/* Legend */}
      <div className="flex justify-around text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
          <span className="text-gray-700">Delivery Boy (You)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded-full"></div>
          <span className="text-gray-700">Customer</span>
        </div>
      </div>
    </div>
  );
}
