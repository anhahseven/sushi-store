import { useEffect } from "react";
import { Outlet, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";

export default function Layout() {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const loginSuccess = searchParams.get("loginSuccess");
    if (loginSuccess === "true") {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Login Successful",
        text: "Welcome to Murakami Sushi!",
        showConfirmButton: false,
        timer: 3000
      });
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("loginSuccess");
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  return (
    <div className="min-h-screen bg-[#f9fafb] text-gray-900 font-sans">
      <Outlet />
    </div>
  );
}
