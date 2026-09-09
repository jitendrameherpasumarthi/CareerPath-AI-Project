import { Navigate, Outlet } from "react-router-dom";

function ProtectedRoute() {
    return localStorage.getItem("token") ? <Outlet /> : <Navigate to="/login" replace />;
}

export default ProtectedRoute;