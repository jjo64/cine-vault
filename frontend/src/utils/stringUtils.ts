export const createSlug = (title: string): string => {
    return title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
        .trim()
        .replace(/\s+/g, "-") // Replace spaces with hyphens
        .replace(/-+/g, "-"); // Remove duplicate hyphens
};
