import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { useAuth } from "../../context/AuthContext";
import { useHeader } from "../../context/HeaderContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


interface MasterItem {
  id: number;
  name: string;
  category: string;
  unit: string;
  image_url: string | null;
}

interface Location {
  id: number;
  name: string;
}

const API_BASE = import.meta.env.VITE_API_URL || "";

export default function ManagerDailyStock() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<Location[]>([]);
  const [masterItems, setMasterItems] = useState<MasterItem[]>([]);
  const [locationName, setLocationName] = useState("");
  const [currentLocationId, setCurrentLocationId] = useState("");
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  // Filters
  const [date, setDate] = useState(searchParams.get("date") || new Date().toISOString().split("T")[0]);
  const [locationId, setLocationId] = useState(searchParams.get("location") || "");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Quantity inputs
  const [quantities, setQuantities] = useState<Record<number, string>>({});

  const fetchDailyStockData = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { date };
      if (locationId) params.location = locationId;

      const res = await axios.get(`${API_BASE}/api/manager/daily-stock`, { params, withCredentials: true });
      setLocationName(res.data.locationName || "");
      setLocations(res.data.locations || []);
      setMasterItems(res.data.masterItems || []);
      setAlreadySubmitted(res.data.alreadySubmitted || false);
      setCurrentLocationId(res.data.currentLocationId ? String(res.data.currentLocationId) : "");

      if (!locationId && res.data.currentLocationId) {
        setLocationId(String(res.data.currentLocationId));
      }

      // Reset quantities inputs
      setQuantities({});
    } catch (err: any) {
      console.error(err);
      showNotification(err.response?.data?.error || "Error loading stock count data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyStockData();
  }, [date, locationId]);

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    const isDark = document.documentElement.classList.contains("dark");
    Swal.fire({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      icon: type,
      title: message,
      background: isDark ? "#1f2937" : "#ffffff",
      color: isDark ? "#ffffff" : "#1f2937",
    });
  };

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    setSearchParams({ date: newDate, location: locationId });
  };

  const handleLocationChange = (newLocId: string) => {
    setLocationId(newLocId);
    setSearchParams({ date, location: newLocId });
  };

  const handleQuantityChange = (itemId: number, val: string) => {
    setQuantities((prev) => ({
      ...prev,
      [itemId]: val,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!locationId) {
      showNotification("Error: No location selected.", "error");
      return;
    }

    const itemsToSubmit = masterItems
      .filter((item) => quantities[item.id] !== undefined && quantities[item.id] !== "")
      .map((item) => ({
        name: item.name,
        category: item.category,
        unit: item.unit,
        quantity: quantities[item.id],
      }));

    if (itemsToSubmit.length === 0) {
      showNotification("Please enter at least one quantity.", "error");
      return;
    }

    const isDark = document.documentElement.classList.contains("dark");
    Swal.fire({
      title: "Saving...",
      allowOutsideClick: false,
      background: isDark ? "#111827" : "#fff",
      color: isDark ? "#fff" : "#000",
      didOpen: () => Swal.showLoading(),
    });

    try {
      await axios.post(
        `${API_BASE}/api/manager/daily-stock`,
        {
          items: itemsToSubmit,
          date,
          location_id: locationId,
        },
        { withCredentials: true }
      );

      Swal.fire({
        title: "Success!",
        text: "Stock Count Saved Successfully!",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
        background: isDark ? "#111827" : "#fff",
        color: isDark ? "#fff" : "#000",
      });
      fetchDailyStockData();
    } catch (err: any) {
      console.error(err);
      showNotification(err.response?.data?.error || "Error saving stock count", "error");
    }
  };

  const isHeadManagerOrAdmin = user && ["admin", "manager", "demo"].includes(user.role.trim().toLowerCase());

  const { setHeaderContent } = useHeader();

  useEffect(() => {
    setHeaderContent(
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <input
          type="date"
          value={date}
          onChange={(e) => handleDateChange(e.target.value)}
          className="px-2.5 py-1.5 border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] rounded-lg text-xs font-semibold text-gray-750 dark:text-white focus:outline-none shadow-sm transition-colors w-full sm:w-auto shrink-0"
        />

        {isHeadManagerOrAdmin ? (
          <Select
            value={String(locationId)}
            onValueChange={(val) => handleLocationChange(val)}
          >
            <SelectTrigger className="px-2.5 py-1.5 h-8 border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] rounded-lg text-xs font-semibold text-gray-750 dark:text-white focus:outline-none shadow-sm transition-colors w-full sm:w-[160px] flex-1 sm:flex-none pr-8 shrink-0 flex items-center justify-between">
              <SelectValue placeholder="Select Location" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-zinc-800 rounded-lg shadow-lg text-xs font-semibold">
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={String(loc.id)}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="bg-gray-100 dark:bg-[#18181b] border border-gray-200 dark:border-zinc-800 text-gray-650 dark:text-gray-300 text-xs rounded-lg px-3 py-1.5 shadow-sm w-full sm:w-[160px] flex-1 sm:flex-none flex justify-between items-center cursor-not-allowed font-bold">
            <span>{locationName}</span>
            <i className="fa-solid fa-lock text-[10px] text-gray-400 ml-2"></i>
          </div>
        )}
      </div>
    );
    return () => setHeaderContent(null);
  }, [date, locationId, locations, isHeadManagerOrAdmin, locationName, setHeaderContent]);

  // Filtered master items
  const categories = ["Cook", "Drink", "Supplies", "Packaging"];

  return (
    <div className="w-full my-6 space-y-6">
      {/* Toast Notifications */}
      <div id="toast-container" className="fixed top-24 right-4 z-[9999] flex flex-col gap-3 pointer-events-none"></div>

      <div className="flex flex-col items-center gap-6 bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors">
        <div className="relative w-full max-w-2xl">
          <input
            type="text"
            placeholder="Search ingredients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 shadow-sm text-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-gray-900 focus:outline-none transition-all placeholder-gray-450"
          />
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
            <i className="fa-solid fa-magnifying-glass"></i>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-5 py-2 rounded-full font-bold text-sm transition-all shadow-sm ${
              selectedCategory === "all"
                ? "bg-indigo-650 text-white transform scale-105"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2 rounded-full font-bold text-sm transition-all shadow-sm ${
                selectedCategory === cat
                  ? "bg-indigo-650 text-white transform scale-105"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div>
        {loading ? (
          <div className="text-center py-12 text-gray-500">
            <i className="fa-solid fa-spinner fa-spin mr-2"></i> Loading daily stock count sheet...
          </div>
        ) : alreadySubmitted ? (
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-xl p-10 text-center animate-fade-up">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl shadow-sm">
              <i className="fa-solid fa-check"></i>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Stock Count Submitted</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-8 text-lg">
              Record for <b>{new Date(date).toLocaleDateString()}</b> is complete.
            </p>
            <Link
              to="/manager/daily-stock/history"
              className="inline-block bg-indigo-650 hover:bg-indigo-755 text-white px-6 py-3 rounded-xl font-bold transition shadow-md"
            >
              View History
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-12">
            {categories.map((cat) => {
              const catItems = masterItems.filter((i) => {
                const matchesCategory = selectedCategory === "all" || i.category === selectedCategory;
                const matchesSearch = i.name.toLowerCase().includes(searchTerm.toLowerCase());
                return i.category === cat && matchesCategory && matchesSearch;
              });

              if (catItems.length === 0) return null;

              return (
                <section key={cat} className="stock-section" data-category={cat}>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2 border-b border-gray-200 dark:border-gray-850 pb-2">
                    {cat === "Cook" && <i className="fa-solid fa-utensils text-orange-500"></i>}
                    {cat === "Drink" && <i className="fa-solid fa-glass-water text-blue-500"></i>}
                    {cat === "Supplies" && <i className="fa-solid fa-boxes-stacked text-purple-500"></i>}
                    {cat === "Packaging" && <i className="fa-solid fa-box-open text-amber-600"></i>}
                    <span>{cat}</span>
                    <span className="text-xs font-normal text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-2 py-0.5 rounded-full ml-auto">
                      {catItems.length} items
                    </span>
                  </h3>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {catItems.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white dark:bg-gray-900 rounded-2xl p-3 shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all item-card group relative"
                      >
                        <div className="h-28 w-full rounded-xl bg-gray-50 dark:bg-gray-850 mb-3 overflow-hidden flex items-center justify-center relative">
                          <img
                            src={item.image_url || "https://via.placeholder.com/100?text=No+Img"}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            alt={item.name}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://via.placeholder.com/100?text=No+Img";
                            }}
                          />
                          <span className="absolute top-2 right-2 text-[10px] font-bold bg-white/90 dark:bg-black/80 px-1.5 py-0.5 rounded text-gray-550 dark:text-gray-300 uppercase shadow-sm">
                            {item.unit || "Unit"}
                          </span>
                        </div>

                        <div className="text-center mb-3">
                          <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm leading-tight line-clamp-2 h-9 flex items-center justify-center item-name">
                            {item.name}
                          </h4>
                        </div>

                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0"
                            value={quantities[item.id] || ""}
                            onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                            className="w-full text-center bg-gray-50 dark:bg-gray-850 dark:text-white border border-gray-200 dark:border-gray-750 rounded-lg py-2.5 font-bold text-indigo-600 dark:text-indigo-400 focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-900 focus:outline-none transition-all placeholder-gray-300 dark:placeholder-gray-600"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}

            <div className="fixed bottom-6 right-6 z-40">
              <button
                type="submit"
                id="submitBtn"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-full font-bold shadow-2xl transition-transform active:scale-95 flex items-center gap-3 text-lg border-2 border-white/20"
              >
                <i className="fa-solid fa-save"></i> Save Count
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
