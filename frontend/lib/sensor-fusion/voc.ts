export type VocBox = {
  name: string;
  level: 1 | 2;
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
};

/** The same corners the XML writes. Percents in, picture pixels out. */
export function percentBox(mark: { name: string; level: 1 | 2; left: number; top: number; right: number; bottom: number }, width: number, height: number): VocBox {
  return {
    name: mark.name,
    level: mark.level === 2 ? 2 : 1,
    xmin: Math.round((Math.min(mark.left, mark.right) / 100) * width),
    ymin: Math.round((Math.min(mark.top, mark.bottom) / 100) * height),
    xmax: Math.round((Math.max(mark.left, mark.right) / 100) * width),
    ymax: Math.round((Math.max(mark.top, mark.bottom) / 100) * height),
  };
}

export type VocPage = {
  file: string;
  width: number;
  height: number;
  boxes: VocBox[];
  renamedFrom?: string;
};

/** The one XML escape for Sensor Fusion. The page and this file use it, so a name reads back as it was written. */
export function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function unescapeXml(value: string) {
  return value
    .replace(/&quot;/g, "\"")
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&");
}

export function vocXml(page: VocPage) {
  const boxes = page.boxes
    .map((item) => {
      return `  <object>
    <name>${escapeXml(item.name)}</name>
    <level>${item.level}</level>
    <pose>Unspecified</pose>
    <truncated>0</truncated>
    <difficult>0</difficult>
    <bndbox>
      <xmin>${item.xmin}</xmin>
      <ymin>${item.ymin}</ymin>
      <xmax>${item.xmax}</xmax>
      <ymax>${item.ymax}</ymax>
    </bndbox>
  </object>`;
    })
    .join("\n");
  const renamed = page.renamedFrom ? `  <renamed-from>${escapeXml(page.renamedFrom)}</renamed-from>\n` : "";
  return `<?xml version="1.0" encoding="UTF-8"?>
<annotation>
  <folder>Pictures</folder>
  <filename>${escapeXml(page.file)}</filename>
${renamed}  <size>
    <width>${page.width}</width>
    <height>${page.height}</height>
    <depth>3</depth>
  </size>
${boxes}
</annotation>
`;
}

function tag(chunk: string, name: string) {
  return new RegExp(`<${name}>([\\s\\S]*?)</${name}>`).exec(chunk)?.[1] ?? "";
}

export function readVoc(xml: string): VocPage {
  const width = Number(tag(xml, "width") || 0);
  const height = Number(tag(xml, "height") || 0);
  const renamed = tag(xml, "renamed-from");
  const boxes: VocBox[] = [];
  for (const chunk of xml.match(/<object>[\s\S]*?<\/object>/g) || []) {
    const level = Number(tag(chunk, "level") || 1);
    boxes.push({
      name: unescapeXml(tag(chunk, "name")),
      level: level === 2 ? 2 : 1,
      xmin: Number(tag(chunk, "xmin") || 0),
      ymin: Number(tag(chunk, "ymin") || 0),
      xmax: Number(tag(chunk, "xmax") || 0),
      ymax: Number(tag(chunk, "ymax") || 0),
    });
  }
  const page: VocPage = {
    file: unescapeXml(tag(xml, "filename")),
    width,
    height,
    boxes,
  };
  if (renamed) page.renamedFrom = unescapeXml(renamed);
  return page;
}
