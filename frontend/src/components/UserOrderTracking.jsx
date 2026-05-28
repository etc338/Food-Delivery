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
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
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

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  preparing: "bg-blue-100 text-blue-800 border-blue-300",
  "Out Of Delivery": "bg-purple-100 text-purple-800 border-purple-300",
  picked: "bg-orange-100 text-orange-800 border-orange-300",
  delivered: "bg-green-100 text-green-800 border-green-300",
};

export default function UserOrderTracking({ orderId, shopId }) {
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deliveryBoyLocation, setDeliveryBoyLocation] = useState({ lat: 0, lon: 0 });
  const [orderStatus, setOrderStatus] = useState("");

  const socketRef = useSocket();

  useEffect(() => {
    const fetchTrackingData = async () => {
      try {
        const response = await axios.get(
          `${serverUrl}/api/order/track/${orderId}/${shopId}`,
          { withCredentials: true },
        );
        const data = response.data;
        setTrackingData(data);
        setOrderStatus(data.status);
        if (data.deliveryBoy?.location?.coordinates) {
          setDeliveryBoyLocation({
            lat: data.deliveryBoy.location.coordinates[1] || 0,
            lon: data.deliveryBoy.location.coordinates[0] || 0,
          });
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching tracking data:", error);
        setLoading(false);
      }
    };

    fetchTrackingData();
  }, [orderId, shopId]);

  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;

    const handleLocationUpdate = ({ lat, lon }) => {
      setDeliveryBoyLocation({ lat, lon });
    };

    const handleStatusUpdate = ({ orderId: updatedOrderId, status }) => {
      if (updatedOrderId.toString() === orderId.toString()) {
        setOrderStatus(status);
      }
    };

    socket.on("location:update", handleLocationUpdate);
    socket.on("order:status_updated", handleStatusUpdate);

    return () => {
      socket.off("location:update", handleLocationUpdate);
      socket.off("order:status_updated", handleStatusUpdate);
    };
  }, [socketRef?.current, orderId]);
  const [routeLine, setRouteLine] = useState([]);
  const timeoutRef = React.useRef(null);

  const customerLocationRaw = {
    lat: trackingData?.deliveryAddress?.latitude || 0,
    lon: trackingData?.deliveryAddress?.longitude || 0,
  };

  useEffect(() => {
    if (deliveryBoyLocation.lat === 0 || customerLocationRaw.lat === 0) return;

    if (timeoutRef.current) return;

    timeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${deliveryBoyLocation.lon},${deliveryBoyLocation.lat};${customerLocationRaw.lon},${customerLocationRaw.lat}?overview=full&geometries=geojson`
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
            [customerLocationRaw.lat, customerLocationRaw.lon],
          ]);
        }
      } catch (error) {
        console.error("OSRM Routing error:", error);
        setRouteLine([
          [deliveryBoyLocation.lat, deliveryBoyLocation.lon],
          [customerLocationRaw.lat, customerLocationRaw.lon],
        ]);
      } finally {
        timeoutRef.current = null;
      }
    }, 1500);
  }, [deliveryBoyLocation.lat, deliveryBoyLocation.lon, customerLocationRaw.lat, customerLocationRaw.lon]);


  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff4d2d]"></div>
      </div>
    );
  }

  if (!trackingData || !trackingData.deliveryBoy) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
        <p className="text-yellow-800 font-medium">🚴 Waiting for delivery boy assignment...</p>
        <p className="text-sm text-yellow-600 mt-1">Your order will be picked up soon!</p>
      </div>
    );
  }

  const customerLocation = {
    lat: trackingData.deliveryAddress?.latitude || 0,
    lon: trackingData.deliveryAddress?.longitude || 0,
  };

  const distance = calculateDistance(
    deliveryBoyLocation.lat,
    deliveryBoyLocation.lon,
    customerLocation.lat,
    customerLocation.lon,
  );



  const mapCenter = [
    (deliveryBoyLocation.lat + customerLocation.lat) / 2,
    (deliveryBoyLocation.lon + customerLocation.lon) / 2,
  ];

  const statusLabel = orderStatus === "Out Of Delivery" ? "Out for Delivery" : orderStatus;
  const statusStyle = statusColors[orderStatus] || "bg-gray-100 text-gray-800 border-gray-300";

  return (
    <div className="space-y-4">
      <div className={`${statusStyle} border-2 rounded-lg p-4 text-center`}>
        <p className="text-lg font-bold uppercase tracking-wide">{statusLabel}</p>
        <p className="text-xs mt-1 flex items-center justify-center gap-1">
          <span className="w-2 h-2 bg-current rounded-full animate-pulse inline-block"></span>
          Live updates via socket
        </p>
      </div>

      <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
        <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
          <span className="text-xl">🚴</span> Delivery Partner
        </h3>
        <p className="text-gray-700">
          <span className="font-semibold">Name:</span> {trackingData.deliveryBoy.fullName}
        </p>
        <p className="text-gray-700">
          <span className="font-semibold">Phone:</span> {trackingData.deliveryBoy.mobile}
        </p>
        
        <div className="flex flex-col gap-2 mt-3 bg-gray-50 border border-gray-100 p-3 rounded-lg">
          <p className="text-sm text-gray-600 flex items-center justify-between">
            <span className="flex items-center gap-1.5">📍 Distance Away</span>
            <span className="font-bold text-[#ff4d2d]">{distance} km</span>
          </p>
          {trackingData.estimatedTime && (
            <div className="h-[1px] w-full bg-gray-200"></div>
          )}
          {trackingData.estimatedTime && (
            <p className="text-sm text-gray-600 flex items-center justify-between">
              <span className="flex items-center gap-1.5">⏳ Expected Arrival</span>
              <span className="font-bold text-[#ff4d2d]">{trackingData.estimatedTime}</span>
            </p>
          )}
        </div>
      </div>

      <div className="rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg">
        <MapContainer
          center={mapCenter}
          zoom={14}
          style={{ height: "350px", width: "100%" }}
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
              color="#ff4d2d" 
              weight={4} 
              opacity={0.8} 
              dashArray={routeLine.length === 2 ? "10, 10" : ""} 
            />
          )}
        </MapContainer>
      </div>

      <div className="flex justify-around text-sm bg-gray-50 p-3 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
          <span className="text-gray-700 font-medium">Delivery Partner</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded-full"></div>
          <span className="text-gray-700 font-medium">Your Location</span>
        </div>
      </div>
    </div>
  );
}
