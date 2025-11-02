import React, { useEffect, useState } from "react";
import {
  GoogleMap,
  LoadScript,
  Marker,
  DirectionsRenderer,
} from "@react-google-maps/api";
import axios from "axios";
import type { ParkingSpot } from "./ParkingSpot ";

const containerStyle = {
  width: "300vw",
  height: "600px",
};

const center = { lat: 37.028790, lng: -7.923860 };
const initialCarPosition = { lat: 37.028574, lng: -7.923958 };
const VITE_GOOGLE_MAPS_API_KEY =
  "AIzaSyDSC4UvHHkir4s0ZENB6iHQboc3ktIevTg";

const MapView: React.FC = () => {
  const [parkingSpots, setParkingSpots] = useState<ParkingSpot[]>([]);
  const [carPosition, setCarPosition] = useState(initialCarPosition);
  const [routePath, setRoutePath] = useState<google.maps.LatLngLiteral[]>([]);
  const [directions, setDirections] =
    useState<google.maps.DirectionsResult | null>(null);
  const [carIcon, setCarIcon] = useState<google.maps.Icon | undefined>(undefined);
  const [targetSpot, setTargetSpot] = useState<ParkingSpot | null>(null);

  // Fetch parking spots every 500ms
  useEffect(() => {
    const fetchParkingSpots = () => {
      axios
        .get<ParkingSpot[]>("http://localhost:8000/parks")
        .then((res) => setParkingSpots(res.data))
        .catch((err) => console.error("Error fetching parking spots:", err));
    };

    fetchParkingSpots();
    const interval = setInterval(fetchParkingSpots, 500);
    return () => clearInterval(interval);
  }, []);

  // Move car along the route path
  useEffect(() => {
    if (routePath.length === 0 || !targetSpot) return;

    let index = 0;
    const interval = setInterval(() => {
      setCarPosition(routePath[index]);
      setCarIcon({
        url: "/car-icon.png",
        scaledSize: new window.google.maps.Size(40, 40),
      });

      index++;
      if (index >= routePath.length) {
        clearInterval(interval);
        setDirections(null);
        atualizaEstadoLugar(targetSpot);
        setTargetSpot(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [routePath, targetSpot]);

  const handleMapLoad = () => {
    setCarIcon({
      url: "/car-icon.png",
      scaledSize: new window.google.maps.Size(40, 40),
    });
  };

  const determinaHandicapELivre = (spot: ParkingSpot): string => {
    if (spot.tipo) {
      return spot.estado === "livre" ? "/handicap-green.png" : "/handicap-red.png";
    } else {
      return spot.estado === "livre" ? "/park-green.png" : "/park-red.png";
    }
  };

  const atualizaEstadoLugar = (spot: ParkingSpot) => {
    axios
      .post(`http://localhost:8000/parks/atualizaLugar/${spot.id}`)
      .then(() => {
        setParkingSpots((prev) =>
          prev.map((p) => (p.id === spot.id ? { ...p, estado: "reservado" } : p))
        );
      })
      .catch((err) => console.error("Error reserving spot:", err));
  };

  const handleReserveSpot = (spot: ParkingSpot) => {
    if (spot.estado === "ocupado") {
      alert("Não é possível Reservar este lugar");
      return;
    }

    const confirmed = window.confirm(`Pretende Reservar o Lugar: ${spot.id}?`);
    if (!confirmed) return;

    setTargetSpot(spot); // store target spot

    const directionsService = new google.maps.DirectionsService();
    directionsService.route(
      {
        origin: carPosition,
        destination: { lat: spot.latitude, lng: spot.longitude },
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK" && result) {
          setDirections(result);
          const path = result.routes[0].overview_path.map((p) => ({
            lat: p.lat(),
            lng: p.lng(),
          }));
          setRoutePath(path);
        } else {
          console.error("Error fetching directions:", status);
        }
      }
    );
  };

  console.log("TESTe = ", parkingSpots)

  return (
    <LoadScript googleMapsApiKey={VITE_GOOGLE_MAPS_API_KEY}>
      <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={19}>
        {/* Car marker */}
        <Marker
          position={carPosition}
          icon={
            typeof window.google !== "undefined"
              ? {
                  url: carIcon?.url || "/car-icon.png",
                  scaledSize: new window.google.maps.Size(40, 40),
                }
              : undefined
          }
          title="Toyota Supra"
        />

        {/* Parking spot markers */}
        {parkingSpots.map((spot) => (
          <Marker
            key={spot.id}
            position={{ lat: spot.latitude, lng: spot.longitude }}
            icon={{
              url: determinaHandicapELivre(spot),
              scaledSize: new window.google.maps.Size(40, 40),
            }}
            onClick={() => handleReserveSpot(spot)}
            title={`Spot ${spot.id}`}
          />
        ))}

        {/* Directions renderer */}
        {directions && <DirectionsRenderer directions={directions} />}
      </GoogleMap>
    </LoadScript>
  );
};

export default MapView;
