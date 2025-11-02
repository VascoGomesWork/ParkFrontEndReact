export interface ParkingSpot {
    id: number;
    estado: string;
    lastUpdate: string;
    latitude: number;
    longitude: number;
    simulado: boolean;
    tipo:boolean
    available: boolean
}