import { useState, useMemo } from "react";
import type { Film, Filters } from "../types";
import { YEAR_RANGES } from "../constants";

export function useFilmsFilters(films: Film[], query: string) {
  const [filters, setFilters] = useState<Filters>({
    genres: [],
    yearRange: null,
    country: null,
    sortBy: "rating",
  });

  const visibleFilms = useMemo(() => {
    let list = [...films];

    // Search query filtering (redundant if backend already filtered, but keeps it robust)
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (f) =>
          f.title.toLowerCase().includes(q) ||
          f.director.toLowerCase().includes(q) ||
          f.genres.some((g) => g.toLowerCase().includes(q)) ||
          String(f.year).includes(q),
      );
    }

    // Genre filtering
    if (filters.genres.length) {
      list = list.filter((f) =>
        filters.genres.some((g) =>
          f.genres.map((x) => x.toLowerCase()).includes(g.toLowerCase()),
        ),
      );
    }

    // Year range filtering
    if (filters.yearRange) {
      const yr = YEAR_RANGES.find((y) => y.label === filters.yearRange);
      if (yr) list = list.filter((f) => f.year >= yr.from && f.year <= yr.to);
    }

    // Country filtering
    if (filters.country) {
      list = list.filter((f) =>
        f.country.toLowerCase().includes(filters.country!.toLowerCase()),
      );
    }

    // Sorting
    if (filters.sortBy === "rating") {
      list.sort((a, b) => b.rating - a.rating);
    } else if (filters.sortBy === "recent") {
      list.sort((a, b) => b.year - a.year);
    } else if (filters.sortBy === "alpha") {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }

    return list;
  }, [films, query, filters]);

  const updateFilter = (key: keyof Filters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleGenre = (g: string) => {
    setFilters((prev) => ({
      ...prev,
      genres: prev.genres.includes(g)
        ? prev.genres.filter((x) => x !== g)
        : [...prev.genres, g],
    }));
  };

  const removeFilter = (key: keyof Filters, value?: string) => {
    if (key === "genres" && value) {
      setFilters((prev) => ({
        ...prev,
        genres: prev.genres.filter((g) => g !== value),
      }));
    } else if (key === "sortBy") {
      setFilters((prev) => ({ ...prev, sortBy: "rating" }));
    } else {
      setFilters((prev) => ({ ...prev, [key]: key === "genres" ? [] : null }));
    }
  };

  const clearAllFilters = () => {
    setFilters({
      genres: [],
      yearRange: null,
      country: null,
      sortBy: "rating",
    });
  };

  const hasActiveFilters =
    filters.genres.length > 0 ||
    filters.yearRange ||
    filters.country ||
    filters.sortBy !== "rating";

  return {
    filters,
    visibleFilms,
    updateFilter,
    toggleGenre,
    removeFilter,
    clearAllFilters,
    hasActiveFilters,
  };
}
