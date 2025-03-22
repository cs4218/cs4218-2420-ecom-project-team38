import React from "react";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/auth";
import { Outlet, useLocation } from "react-router-dom";
import axios from "axios";
import Spinner from "../Spinner";
import toast from "react-hot-toast";

export default function PrivateRoute() {
  const [ok, setOk] = useState(false);
  const [auth, setAuth] = useAuth();
  const location = useLocation();

  useEffect(() => {
    const authCheck = async () => {
      try {
        const res = await axios.get("/api/v1/auth/user-auth");
        if (res.data.ok) {
          setOk(true);
        } else {
          setOk(false);
          clearAuth();
        }
      } catch (error) {
        setOk(false);
        clearAuth();
      }
    };

    const clearAuth = () => {
      setAuth({
        ...auth,
        user: null,
        token: "",
      });
      localStorage.removeItem("auth");
      toast.error("Session expired! Please login again.");
    };

    if (auth?.token) authCheck();
  }, [auth?.token, location.pathname]);

  return ok ? <Outlet /> : <Spinner path="" />;
}
