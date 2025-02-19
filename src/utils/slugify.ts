export const slugify = (text: string): string => {
    return text
        .toLowerCase()
        .replace(/ \/ /g, "-") // Replace forward slash with dash surrounded by spaces
        .replace(/\//g, "-") // replace forward slash with dash
        .replace(/\s+/g, "-") // Replace spaces with dashes
        .replace(/[^\w-]/g, ""); // Remove non-word characters except dashes
};
