import React, { useState, useEffect } from "react";
import axios from "axios";
import { useHeader } from "../../context/HeaderContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


interface Transaction {
  id: number;
  created_at: string;
  pickup_location: string;
  total_price: number;
  status: string;
  email: string;
}

interface Stats {
  grossSales: string;
  netProfit: string;
  avgOrderValue: string;
  totalTx: number;
}

interface LocationItem {
  id: number;
  name: string;
}

export const AdminReports: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats>({
    grossSales: "0.00",
    netProfit: "0.00",
    avgOrderValue: "0.00",
    totalTx: 0,
  });
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [location, setLocation] = useState<string>("All");

  const API_BASE = import.meta.env.VITE_API_URL || "";

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE}/api/admin/reports?date=${date}&location=${location}`
      );
      setTransactions(res.data.orders || []);
      setStats(res.data.stats || { grossSales: "0.00", netProfit: "0.00", avgOrderValue: "0.00", totalTx: 0 });
      setLocations(res.data.locations || []);
    } catch (err) {
      console.error("Error loading sales reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [date, location]);

  const { setHeaderContent } = useHeader();

  useEffect(() => {
    setHeaderContent(
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-2.5 py-1.5 border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] rounded-lg text-xs font-semibold text-gray-750 dark:text-white focus:outline-none shadow-sm transition-colors w-full sm:w-auto shrink-0"
        />

        <Select
          value={location}
          onValueChange={(val) => setLocation(val)}
        >
          <SelectTrigger className="px-2.5 py-1.5 h-8 border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] rounded-lg text-xs font-semibold text-gray-750 dark:text-white focus:outline-none shadow-sm transition-colors w-full sm:w-[150px] flex-1 sm:flex-none pr-8 shrink-0 flex items-center justify-between">
            <SelectValue placeholder="All Locations" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-zinc-800 rounded-lg shadow-lg text-xs font-semibold">
            <SelectItem value="All">All Locations</SelectItem>
            {locations.map((loc) => (
              <SelectItem key={loc.id} value={loc.name}>
                {loc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
    return () => setHeaderContent(null);
  }, [date, location, locations, setHeaderContent]);

  return (
    <div className="w-full font-sans">

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading reports data...</div>
      ) : (
        <>
          {/* Sales metrics summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            {/* Gross Sales */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Gross Sales
              </p>
              <p className="text-3xl font-black text-gray-900 dark:text-white">
                {stats.grossSales} $
              </p>
            </div>

            {/* Net Profit (Est) */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Net Profit (Est. 70%)
              </p>
              <p className="text-3xl font-black text-orange-500">{stats.netProfit} $</p>
            </div>

            {/* Average Order Value */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Avg. Order Value
              </p>
              <p className="text-3xl font-black text-gray-900 dark:text-white">
                {stats.avgOrderValue} $
              </p>
            </div>

            {/* Total Transactions */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Transactions
              </p>
              <p className="text-3xl font-black text-gray-900 dark:text-white">{stats.totalTx}</p>
            </div>
          </div>

          {/* Transactions details table */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">Transaction History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 text-sm font-bold uppercase">
                  <tr>
                    <th className="p-5">ID</th>
                    <th className="p-5">Time</th>
                    <th className="p-5">Customer</th>
                    <th className="p-5">Pickup Location</th>
                    <th className="p-5">Price</th>
                    <th className="p-5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm text-gray-700 dark:text-gray-300">
                  {transactions.length > 0 ? (
                    transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition">
                        <td className="p-5 font-mono">#{tx.id}</td>
                        <td className="p-5">
                          {new Date(tx.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="p-5">{tx.email || "Guest"}</td>
                        <td className="p-5">{tx.pickup_location}</td>
                        <td className="p-5 font-bold text-gray-900 dark:text-white">
                          {Number(tx.total_price).toFixed(2)} $
                        </td>
                        <td className="p-5">
                          <span
                            className={`px-2 py-1 rounded text-xs font-bold ${
                              tx.status === "Completed"
                                ? "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400"
                                : tx.status === "Cancelled"
                                ? "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"
                                : "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-400"
                            }`}
                          >
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-gray-400 dark:text-gray-500">
                        No transactions recorded for this selection.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
