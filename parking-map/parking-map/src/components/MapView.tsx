import React, { useEffect, useState } from "react";
import { GoogleMap, LoadScript, Rectangle, Marker, DirectionsRenderer } from "@react-google-maps/api";
import axios from "axios";
import type { ParkingSpot } from "./ParkingSpot ";

const containerStyle = {
  width: "100%",
  height: "600px",
};

const center = { lat: 37.028959, lng: -7.923182 };

// Initial car position
const initialCarPosition = { lat: 37.028574, lng: -7.923958 };

const VITE_GOOGLE_MAPS_API_KEY = "AIzaSyDSC4UvHHkir4s0ZENB6iHQboc3ktIevTg";

const MapView: React.FC = () => {
  const [parkingSpots, setParkingSpots] = useState<ParkingSpot[]>([]);
  const [carPosition, setCarPosition] = useState(initialCarPosition);
  const [routePath, setRoutePath] = useState<google.maps.LatLngLiteral[]>([]);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [carIcon, setCarIcon] = useState<google.maps.Icon | undefined>(undefined);

  // Fetch parking spots
  useEffect(() => {
    axios
      .get<ParkingSpot[]>("http://localhost:8000/parks")
      .then((res) => setParkingSpots(res.data))
      .catch((err) => console.error("Error fetching parking spots:", err));
  }, []);

  // Move car along the route path
  useEffect(() => {
    if (routePath.length === 0) return;

    let index = 0;
    const interval = setInterval(() => {
      setCarPosition(routePath[index]);

      //Changes the car icon
      setCarIcon({
      url: "/toyota-supra.png", // switch to moving icon
      scaledSize: new window.google.maps.Size(40, 40),
      });

      index++;
      if (index >= routePath.length) {
      clearInterval(interval);
      setDirections(null); // <-- remove the route
      //atualizaEstadoLugar(spot)
    }
    }, 1000); // Adjust speed here

    return () => clearInterval(interval);
  }, [routePath]);

  const handleMapLoad = (map: google.maps.Map) => {
    setCarIcon({
      url: "/car-idle.png",
      scaledSize: new window.google.maps.Size(40, 40),
    });
  };


  const atualizaEstadoLugar = (spot : ParkingSpot) => {

    axios.post(`http://localhost:8000/parks/atualizaLugar/${spot.id}`)
      .then(() => {
        // Update parking spots
        setParkingSpots(prev =>
          prev.map(p => (p.id === spot.id ? { ...p, estado: "reservado" } : p))
        );

        // Animate car to this spot
        const directionsService = new google.maps.DirectionsService();
        directionsService.route(
          {
            origin: carPosition,
            destination: { lat: 37.028765, lng: -7.923403 },
            travelMode: google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === "OK" && result) {
              setDirections(result);
              const path = result.routes[0].overview_path.map(p => ({ lat: p.lat(), lng: p.lng() }));
              setRoutePath(path);
            } else {
              console.error("Error fetching directions:", status);
            }
          }
        );
      })
      .catch(err => console.error("Error reserving spot:", err));

  }

  // Handle rectangle click → reserve & animate car
  const handleReserveSpot = (spot: ParkingSpot) => {

    if(spot.estado === "ocupado") {
      alert("Não é possível Reservar este lugar")
      return;
    }

    const confirmed = window.confirm(`Pretende Reservar o Lugar: ${spot.id}?`);
    if (!confirmed) return;

    // Animate car to this spot
        const directionsService = new google.maps.DirectionsService();
        directionsService.route(
          {
            origin: carPosition,
            destination: { lat: spot.latitude/*37.028765*/, lng: spot.longitude/*-7.923403*/ },
            travelMode: google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === "OK" && result) {
              setDirections(result);
              const path = result.routes[0].overview_path.map(p => ({ lat: p.lat(), lng: p.lng() }));
              setRoutePath(path);
            } else {
              console.error("Error fetching directions:", status);
            }
          }
        );
  };

  useEffect(() => {
    // Function to fetch parking spots
    const fetchParkingSpots = () => {
      console.log("TESTE")
      axios
        .get<ParkingSpot[]>("http://localhost:8000/parks/a1")
        .then((res) => setParkingSpots(res.data))
        .catch((err) => console.error("Error fetching parking spots:", err));
    };

    // Initial fetch
    fetchParkingSpots();

    // Poll every 2 seconds
    const interval = setInterval(fetchParkingSpots, 2000);

    // Clean up on unmount
    return () => clearInterval(interval);
  }, []);


  return (
    <LoadScript googleMapsApiKey={VITE_GOOGLE_MAPS_API_KEY}>
      <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={19}>
        {/* Car marker */}
        <Marker
          position={carPosition}
          //icon={carIcon}
          icon={
            typeof window.google !== "undefined"
              ? {
                  url: "/car-icon.png",
                  scaledSize: new window.google.maps.Size(40, 40),
                }
              : undefined // fallback until google is loaded
          }
          title="Toyota Supra"
        />

        {/* Parking spots */}
        {parkingSpots.map((spot) => {
          const bounds = {
            north: spot.latitude + 0.00002,
            south: spot.latitude - 0.00002,
            east: spot.longitude + 0.00002,
            west: spot.longitude - 0.00002,
          };
          return (
            <Rectangle
              key={spot.id}
              bounds={bounds}
              options={{
                fillColor: spot.estado === "livre" ? "green" : "red",
                fillOpacity: 0.6,
                strokeColor: "black",
                strokeWeight: 1,
              }}
              onClick={() => handleReserveSpot(spot)}
            />
          );
        })}

        {/* Directions renderer */}
        {directions && <DirectionsRenderer directions={directions} />}
      </GoogleMap>
    </LoadScript>
  );
};

export default MapView;
