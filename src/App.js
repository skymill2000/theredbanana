import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import TtsScreen from "./pages/TtsScreen";
import AudioStreamer from "./pages/AudioStreamer";
import GoogleMap from "./pages/GoogleMapPages";
import UserGoogleMap from "./pages/UserGoogleMap";

function App() {
  return (
    <Router>
      <Routes>
        {/* <Route path="/" element={<AudioStreamer />} /> */}
        <Route path="/tts" element={<TtsScreen />} />
        <Route path="/google" element={<GoogleMap></GoogleMap>} />
        <Route path="/user/google" element={<UserGoogleMap></UserGoogleMap>} />
      </Routes>
    </Router>
  );
}

export default App;
