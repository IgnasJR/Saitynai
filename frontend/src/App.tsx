import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router";
import Login from "./Pages/Login";
import FrontPage from "./Pages/FrontPage";
import AlbumPage from "./Pages/AlbumPage";
import Header from "./Components/Header";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<FrontPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<div>yo</div>} />
        <Route path="/album/:id" element={<AlbumPage />} />
        <Route
          path="*"
          element={
            <>
              <Header />
              <div className="flex items-center justify-center h-screen text-5xl">
                404 — Page not found
              </div>
            </>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
