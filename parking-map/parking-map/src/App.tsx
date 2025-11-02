import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import MapView from './components/MapView'

function App() {

   return (
      <div className="App">
        <h1>🅿️ Parking Spot Map</h1>
        <MapView />
      </div>
    );
}

export default App
