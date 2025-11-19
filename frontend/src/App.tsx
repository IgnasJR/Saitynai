import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router";
import Login from "./Pages/Login";
import FrontPage from "./Pages/FrontPage";
import { useState } from "react";
import User from "./Models/User";
import AlbumPage from "./Pages/AlbumPage";

function App() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [user, setUser] = useState<User | null>(null);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<FrontPage />} />
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/signup" element={<div>yo</div>} />
        <Route path="/album/:id" element={<AlbumPage />} />
      </Routes>
    </Router>
  );
}

export default App;
