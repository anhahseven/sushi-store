import React, { useState, useEffect } from "react";
import axios from "axios";
import { CardSkeleton } from "../components/ui/skeleton";

interface LocationItem {
  id: number;
  name: string;
  address: string;
  google_map_url?: string;
  status: string;
  hours_mon_fri?: string;
  hours_sat_sun?: string;
}

export const Locations: React.FC = () => {
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const API_BASE = import.meta.env.VITE_API_URL || "";

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/locations`);
        setLocations(res.data.locations || []);
      } catch (err) {
        console.error("Error fetching locations:", err);
        setError("Failed to load locations.");
      } finally {
        setLoading(false);
      }
    };
    fetchLocations();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 mt-36 font-sans min-h-[50vh]">
      <section id="page-locations" className="mb-6 md:mb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <h1 className="text-4xl font-extrabold mb-2 text-gray-900 dark:text-white">Our Locations</h1>
            <p className="text-gray-500 dark:text-gray-400">Find the nearest Murakami kitchen.</p>
          </div>
          <a
            href="https://www.google.com/maps/search/Murakami+Kitchen"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 md:mt-0 flex items-center gap-2 text-sm font-semibold text-orange-500 hover:text-orange-600"
          >
            <i className="fa-solid fa-map-location-dot text-lg"></i>
            View All on Map
          </a>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch mt-6">
            <CardSkeleton count={3} heightClass="h-96" />
          </div>
        ) : error ? (
          <div className="text-center py-10 text-red-500">{error}</div>
        ) : locations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch mt-6">
            {locations.map((loc, index) => {
              const mapLink =
                loc.google_map_url && loc.google_map_url.trim() !== ""
                  ? loc.google_map_url
                  : `https://maps.google.com/?q=${encodeURIComponent(loc.address)}`;

              const isOpen = loc.status.trim().toLowerCase() === "open";

              return (
                <div
                  key={loc.id}
                  className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow h-full flex flex-col justify-between"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <i className="fa-solid fa-store text-gray-900 dark:text-white text-xl"></i>
                      </div>
                      {isOpen ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Open
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded-full">
                          Closed
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{loc.name}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{loc.address}</p>

                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Mon-Fri</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {loc.hours_mon_fri || "Closed"}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Sat-Sun</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {loc.hours_sat_sun || "Closed"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <a
                    href={mapLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl font-semibold text-sm text-gray-700 dark:text-gray-200 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors"
                  >
                    Get Directions
                  </a>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 text-gray-400">
            No locations found. Please add them from the Admin Panel.
          </div>
        )}
      </section>
    </div>
  );
};
