import { getCollection } from "astro:content";
import config from "virtual:lyvo-config";

interface MetaConfig {
  order?: string[];
  labels?: Record<string, string>;
}

export async function getDocsHierarchy() {
  const docs = await getCollection("docs");

  const meta: MetaConfig = config.docs?.sidebar || {};

  const orderArr: string[] = meta.order || [];
  const labelsObj: Record<string, string> = meta.labels || {};

  // Create categorized hierarchy
  const categorizedDocs = docs.reduce(
    (acc: Record<string, any[]>, doc: any) => {
      const parts = doc.id.split("/");
      let rawCatId = "root";

      if (parts.length > 1) {
        rawCatId = parts[0];
      }

      if (!acc[rawCatId]) {
        acc[rawCatId] = [];
      }
      acc[rawCatId].push(doc);
      return acc;
    },
    {} as Record<string, any[]>,
  );

  // Sort items within categories based on data.order
  (Object.values(categorizedDocs) as any[][]).forEach((catDocs) => {
    catDocs.sort((a: any, b: any) => (a.data.order || 0) - (b.data.order || 0));
  });

  const topLevelItems = [
    ...(categorizedDocs["root"] || []).map((doc: any) => ({
      id: doc.id.split("/")[0],
      originalId: doc.id.split("/")[0], // The unmapped id for order
      title: doc.data.title,
      type: "doc" as const,
      doc,
    })),
    ...Object.keys(categorizedDocs)
      .filter((catId) => catId !== "root")
      .map((catId) => {
        const label =
          labelsObj[catId] ||
          catId
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
        return {
          id: label,
          originalId: catId, // The unmapped folder name for order
          title: label,
          type: "category" as const,
          items: categorizedDocs[catId],
        };
      }),
  ];

  topLevelItems.sort((a, b) => {
    const orderA = orderArr.indexOf(a.originalId);
    const orderB = orderArr.indexOf(b.originalId);

    const idxA = orderA !== -1 ? orderA : 9999;
    const idxB = orderB !== -1 ? orderB : 9999;

    if (idxA !== idxB) return idxA - idxB;
    return a.title.localeCompare(b.title);
  });

  return {
    topLevelItems,
    docs,
    categorizedDocs,
  };
}

export async function getPrevNextDocs(currentId: string) {
  const { topLevelItems } = await getDocsHierarchy();

  // Flatten the sorted hierarchy back into a pure array of docs
  const sortedDocs = topLevelItems.flatMap((item) =>
    item.type === "doc" ? [item.doc] : item.items,
  );

  const currentIndex = sortedDocs.findIndex((d) => d.id === currentId);

  const prevDoc = currentIndex > 0 ? sortedDocs[currentIndex - 1] : null;
  const nextDoc =
    currentIndex < sortedDocs.length - 1 && currentIndex !== -1
      ? sortedDocs[currentIndex + 1]
      : null;

  return { prevDoc, nextDoc };
}
