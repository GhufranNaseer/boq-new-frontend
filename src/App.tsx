import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "./api/axiosConfig";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";

// Pages
import Login from "./pages/Login.tsx";
import MasterAdminDashboard from "./pages/MasterAdminDashboard.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import DepartmentUserDashboard from "./pages/DepartmentUserDashboard.tsx";
import EventManagement from "./pages/EventManagement.tsx";
import DepartmentManagement from "./pages/DepartmentManagement.tsx";
import UserManagement from "./pages/UserManagement";
import EventTasks from "./pages/EventTasks";
import DocumentIntelligence from "./pages/DocumentIntelligence";
import AuditTrail from "./pages/AuditTrail";
import RecycleBin from "./pages/RecycleBin";

function Home() {
  const [events, setEvents] = useState<any[]>([]);
  const [count, setCount] = useState(0);

  useEffect(() => {
    // GET events from backend
    axios
      .get("/events") // backend ka route
      .then((res) => setEvents(res.data))
      .catch((err) => console.log("API Error:", err));
  }, []);

  return (
    <>
      <h1>Events List</h1>
      <div className="card">
        {events.length > 0 ? (
          <ul style={{ textAlign: "left" }}>
            {events.map((event) => (
              <li key={event.id}>{event.name}</li>
            ))}
          </ul>
        ) : (
          <p>No events found or loading...</p>
        )}
      </div>

      <div className="card">
        <button onClick={() => setCount((c) => c + 1)}>count is {count}</button>
      </div>
    </>
  );
}

// Protected Route Component
const ProtectedRoute = ({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles: string[];
}) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (!roles.includes(user.role)) return <Navigate to="/login" />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/home-demo" element={<Home />} />
          <Route path="/login" element={<Login />} />

          <Route
            path="/master-admin"
            element={
              <ProtectedRoute roles={["MASTER_ADMIN"]}>
                <Layout>
                  <MasterAdminDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <Layout>
                  <AdminDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/department-user"
            element={
              <ProtectedRoute roles={["DEPARTMENT_USER"]}>
                <Layout>
                  <DepartmentUserDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/events"
            element={
              <ProtectedRoute roles={["ADMIN", "MASTER_ADMIN"]}>
                <Layout>
                  <EventManagement />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/:eventId/tasks"
            element={
              <ProtectedRoute roles={['MASTER_ADMIN', 'ADMIN', 'DEPARTMENT_USER']}>
                <Layout>
                  <EventTasks />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/:eventId/intelligence"
            element={
              <ProtectedRoute roles={['MASTER_ADMIN', 'ADMIN']}>
                <Layout>
                  <DocumentIntelligence />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/departments"
            element={
              <ProtectedRoute roles={["ADMIN", "MASTER_ADMIN"]}>
                <Layout>
                  <DepartmentManagement />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute roles={["ADMIN", "MASTER_ADMIN"]}>
                <Layout>
                  <UserManagement />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/audit-trail"
            element={
              <ProtectedRoute roles={["MASTER_ADMIN"]}>
                <Layout>
                  <AuditTrail />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/recycle-bin"
            element={
              <ProtectedRoute roles={["ADMIN", "MASTER_ADMIN", "DEPARTMENT_USER"]}>
                <Layout>
                  <RecycleBin />
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
