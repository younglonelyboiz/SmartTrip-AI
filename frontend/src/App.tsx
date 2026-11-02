import { useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { DemoLogin } from "./pages/DemoLogin";
import { Trips } from "./pages/Trips";
import { Planner } from "./pages/Planner";
import { Itinerary } from "./pages/Itinerary";
import { Comparison } from "./pages/Comparison";
import { Admin } from "./pages/Admin";
import { Explore } from "./pages/Explore";
import { Destination } from "./pages/Destination";
export default function App() {
  const [role, setRole] = useState("traveler");
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout role={role} />}>
          <Route index element={<Explore />} />
          <Route path="/diem-den/:destinationId" element={<Destination />} />
          <Route path="/demo-login" element={<DemoLogin setRole={setRole} />} />
          <Route path="/trips" element={<Trips />} />
          <Route path="/planner" element={<Planner />} />
          <Route
            path="/trips/:tripId/versions/:versionId"
            element={<Itinerary key={location.pathname} />}
          />
          <Route path="/compare/:scenarioId" element={<Comparison />} />
          <Route path="/admin" element={<Admin role={role} />} />
          <Route
            path="*"
            element={
              <section className="panel">
                <h1>Không tìm thấy trang</h1>
                <Link to="/trips">Về chuyến đi</Link>
              </section>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
