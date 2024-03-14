export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/ \/ /g, "-") // Replace forward slash with dash surrounded by spaces
    .replace(/\//g, "-") // replace forward slash with dash
    .replace(/\s+/g, "-") // Replace spaces with dashes
    .replace(/[^\w-]/g, ""); // Remove non-word characters except dashes
};

export const slugToId: Record<string, string> = {
  "data-engineering-data-architecture": "cltfn47k300062hsd8no26vg2",
  "data-science-ai": "cltfn47k300072hsdcpyh0q1z",
  "microsoft-azure-app-development": "cltfn47k300082hsd5twb6p8y",
  "microsoft-azure-administration": "cltfn47k300092hsdxjbu3pr2",
  "front-end-development": "cltfn47k4000a2hsdpo4me9rl",
  "microsoft-back-end-development": "cltfn47k4000b2hsdblm2ngir",
  "microsoft-low-code-development": "cltfn47k4000c2hsd3gzbt7y4",
  "microsoft-integration-development": "cltfn47k4000d2hsdbxg169h3",
  "java-back-end-development": "cltfn47k4000e2hsd0vgrz9vo",
  "application-architecture": "cltfn47k4000f2hsdtccq2i1r",
  "infrastructure-engineering": "cltfn47k4000g2hsdyrp34990",
  "mobile-development": "cltfn47k4000h2hsdd1arf5og",
  wow: "cltfn47k4000i2hsdr2zhoqjb",
  "product-owner-analist-requirements-engineer": "cltfn47k4000j2hsd7q5pf7rx",
  general: "cltfn47k4000k2hsdx4ly9hje",
} as const;
