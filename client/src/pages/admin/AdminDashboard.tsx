import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useHeader } from "../../context/HeaderContext";
import { DashboardStats } from "@/components/stats";
import { ConversationVolumeChart } from "@/components/conversation-volume-chart";
import { OrderStatusDonut } from "@/components/order-status-donut";
import { LocationSalesChart } from "@/components/location-sales-chart";
import { AvgOrderValueChart } from "@/components/avg-order-value-chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ChartItem {
  day: string;
  daily_sales: string;
}

interface StatusItem {
  status: string;
  count: string;
}

interface LocationItem {
  id: number;
  name: string;
}

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<{
    productsCount: number;
    userCount: number;
    ordersCount: number;
    totalRevenue: string;
    chartData: ChartItem[];
    avgValueData: any[];
    locationData: any[];
    statusData: StatusItem[];
    locations: LocationItem[];
    currentFilter: string;
  } | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [filterLocation, setFilterLocation] = useState<string>("All");

  const API_BASE = import.meta.env.VITE_API_URL || "";

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE}/api/admin/dashboard?location=${filterLocation}`
      );
      setData(res.data);
    } catch (err) {
      console.error("Error fetching dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [filterLocation]);

  const { setHeaderContent } = useHeader();

  useEffect(() => {
    if (data?.locations) {
      setHeaderContent(
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="hidden sm:inline text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
            Location:
          </label>
          <Select
            value={filterLocation}
            onValueChange={(val) => setFilterLocation(val)}
          >
            <SelectTrigger className="px-2.5 py-1.5 h-8 border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] rounded-lg text-xs font-semibold text-gray-750 dark:text-white focus:outline-none shadow-sm transition-colors w-full sm:w-[160px] flex-1 sm:flex-none pr-8 shrink-0 flex items-center justify-between">
              <SelectValue placeholder="Select Location" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-zinc-800 rounded-lg shadow-lg text-xs font-semibold">
              <SelectItem value="All">All Locations</SelectItem>
              {data.locations.map((loc) => (
                <SelectItem key={loc.id} value={loc.name}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }
    return () => setHeaderContent(null);
  }, [filterLocation, data?.locations, setHeaderContent]);

  return (
    <div className="w-full font-sans">

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading metrics...</div>
      ) : data ? (
        <div className="flex flex-col gap-6">
          {/* Dashboard Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DashboardStats
              totalRevenue={data.totalRevenue}
              ordersCount={data.ordersCount}
              productsCount={data.productsCount}
              userCount={data.userCount}
            />
          </div>

          {/* Main Chart Section: Sales Area Chart & Status Donut Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <ConversationVolumeChart data={data.chartData} className="lg:col-span-3" />
            <OrderStatusDonut data={data.statusData} />
          </div>

          {/* Bottom Row Charts: Sales by Location & Average Order Value */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <LocationSalesChart data={data.locationData} />
            <AvgOrderValueChart data={data.avgValueData} />
          </div>
        </div>
      ) : (
        <div className="text-center py-25 text-gray-400">Error loading dashboard metrics.</div>
      )}
    </div>
  );
};
