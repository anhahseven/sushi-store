import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      <Outlet />
    </div>
  );
}
