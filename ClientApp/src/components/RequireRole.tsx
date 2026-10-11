import { ReactElement } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/Auth";
import { Role } from "../types";

interface RequireRoleProps {
  role?: Role;
  children: ReactElement;
}

function RequireRole(props: RequireRoleProps) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  }
  if (props.role && user.role !== props.role) {
    return <Navigate to="/" replace />;
  }
  return props.children;
}

export default RequireRole;
