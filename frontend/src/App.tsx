import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router";
import Login from "./Pages/Login";
import FrontPage from "./Pages/FrontPage";
import AlbumPage from "./Pages/AlbumPage";
import ArtistPage from "./Pages/ArtistPage";
import Register from "./Pages/Register";
import Layout from "./Components/Layout";

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<FrontPage />} />
          <Route path="/album/:id" element={<AlbumPage />} />
          <Route path="/artist/:artistId" element={<ArtistPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>
        <Route
          path="*"
          element={
            <Layout>
              <div className="flex items-center justify-center h-screen text-5xl">
                404 — Page not found
              </div>
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
