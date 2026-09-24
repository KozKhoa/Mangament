import * as XLSX from "xlsx";
import { validate as isUUID } from "uuid";

function cleanString(val) {
  if (val === undefined || val === null) return null;
  const str = String(val).trim();
  return str.length > 0 ? str : null;
}

function cleanUUID(val) {
  const str = cleanString(val);
  if (!str) return null;
  return isUUID(str) ? str : null;
}

function cleanNumber(val, defaultVal = null) {
  if (val === undefined || val === null || val === "") return defaultVal;
  const num = Number(val);
  return Number.isNaN(num) ? defaultVal : num;
}

function cleanBoolean(val, defaultVal = true) {
  if (val === undefined || val === null || val === "") return defaultVal;
  if (typeof val === "boolean") return val;
  const str = String(val).trim().toLowerCase();
  if (str === "true" || str === "1" || str === "yes") return true;
  if (str === "false" || str === "0" || str === "no") return false;
  return defaultVal;
}

function cleanStoryType(val) {
  const str = cleanString(val)?.toLowerCase();
  if (!str) return "manga";
  if (str.includes("novel")) return "light_novel";
  if (str === "manga") return "manga";
  return "manga";
}

function cleanStoryStatus(val) {
  const str = cleanString(val)?.toLowerCase();
  const valid = ["ongoing", "finished", "postpone", "upcoming"];
  if (str && valid.includes(str)) return str;
  return "ongoing";
}

function cleanStoryNodeType(val, defaultVal = "chapter") {
  const str = cleanString(val)?.toLowerCase();
  const valid = ["chapter", "arc", "volume"];
  if (str && valid.includes(str)) return str;
  return defaultVal;
}

function cleanStoryNodeContentType(val, hasImageId = false) {
  const str = cleanString(val)?.toLowerCase();
  const valid = ["image", "text", "header", "title"];
  if (str && valid.includes(str)) return str;
  return hasImageId ? "image" : "text";
}

function cleanDeletedStatus(val) {
  const str = cleanString(val)?.toLowerCase();
  const valid = ["not_deleted", "soft_deleted", "soft_deleted_by_parent", "pending_permanent_deletion"];
  if (str && valid.includes(str)) return str;
  return "not_deleted";
}

/**
 * Parses CSV, XLSX, or XLS buffer for batch story import.
 * Supports:
 * 1. Arbitrary column ordering (header-driven column index discovery).
 * 2. Missing/omitted columns (safe fallback with no fixed positional assumptions).
 * 3. Story-only imports (0 story nodes).
 * 4. Story nodes without content.
 * 5. Stories with only title (for attaching nodes to existing stories).
 * 6. Dynamic N-level story nodes (e.g. 3+ levels: Volume -> Chapter -> Part, etc.).
 *
 * @param {Buffer} buffer - File buffer from multer
 * @returns {Array<Object>} List of sanitized, structured row records
 */
export function parseStoriesSpreadsheet(buffer) {
  if (!buffer || buffer.length === 0) {
    throw new Error("File tải lên rỗng hoặc không có dữ liệu");
  }

  // Read workbook from buffer (auto-detect binary xlsx/xls vs UTF-8 text csv/tsv)
  const isZipOrOle =
    buffer.length >= 4 &&
    ((buffer[0] === 0x50 && buffer[1] === 0x4b) || // PK zip (xlsx)
      (buffer[0] === 0xd0 && buffer[1] === 0xcf)); // OLE2 (xls)

  const workbook = isZipOrOle ? XLSX.read(buffer, { type: "buffer", raw: true }) : XLSX.read(buffer.toString("utf8"), { type: "string", raw: true });
  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error("Không tìm thấy trang tính (sheet) hợp lệ trong file");
  }

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  // Convert sheet to array of arrays (header: 1)
  const rawRows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    blankrows: false,
  });

  if (!rawRows || rawRows.length === 0) {
    throw new Error("File bảng tính không có dòng dữ liệu nào");
  }

  // Identify whether row 0 is header
  const firstRow = rawRows[0].map((cell) => String(cell || "").trim());
  const hasHeader = firstRow.some((col) => {
    const norm = col.toLowerCase().replace(/[\s\t_-]+/g, "");
    return norm.includes("title") || norm.includes("story") || norm.includes("node") || norm.includes("nation") || norm.includes("chapter");
  });

  const headerMap = new Map();
  if (hasHeader) {
    firstRow.forEach((col, idx) => {
      const norm = col.toLowerCase().replace(/[\s\t-]+/g, "_");
      if (!norm) return;
      if (!headerMap.has(norm)) headerMap.set(norm, []);
      headerMap.get(norm).push(idx);
    });
  }

  /**
   * Helper to look up a column index:
   * First checks numbered variants (at occurrence 0), then unnumbered variants (at given occurrence).
   */
  const getCol = (numberedNames, unnumberedNames, occurrence = 0) => {
    for (const name of numberedNames) {
      const list = headerMap.get(name);
      if (list && list.length > 0) {
        return list[0];
      }
    }
    for (const name of unnumberedNames) {
      const list = headerMap.get(name);
      if (list && list.length > occurrence) {
        return list[occurrence];
      }
    }
    return -1;
  };

  let storyTitleCol;
  let storyOtherTitleCol;
  let storyTypeCol;
  let storyStatusCol;
  let nationIdCol;
  let nationCol;
  let storyDeletedStatusCol;
  let isActivedCol;
  let summaryCol;
  let coverArtIdCol;
  let coverArtPathCol;
  let genresCol;
  let authorIdsCol;
  const nodeConfigs = [];

  if (hasHeader) {
    // Story header mappings
    storyTitleCol = getCol([], ["story_title", "title"]);
    storyOtherTitleCol = getCol([], ["story_other_title", "story_other_titles", "other_title", "other_titles"]);
    storyTypeCol = getCol([], ["story_type", "type"]);
    storyStatusCol = getCol([], ["story_status", "status"]);
    nationIdCol = getCol([], ["story_nation_id", "nation_id"]);
    nationCol = getCol([], ["story_nation", "nation", "country"]);
    isActivedCol = getCol([], ["is_actived", "is_active", "active"]);
    summaryCol = getCol([], ["story_summary", "summary", "description"]);
    coverArtIdCol = getCol([], ["story_cover_art_id", "cover_art_id", "cover_id"]);
    coverArtPathCol = getCol([], ["story_cover_art_path", "cover_art_path", "cover_path"]);
    genresCol = getCol([], ["story_genres", "genres", "genre", "story_genre"]);
    authorIdsCol = getCol([], ["story_author_ids", "author_ids", "author_id", "story_author_id", "authorids", "authorid", "authors", "author"]);

    // Determine how many node levels exist
    let maxNumberedLevel = 0;
    for (const key of headerMap.keys()) {
      const m = key.match(/^(?:story_)?node_?(\d+)/i) || key.match(/^(?:story_)?node_?(?:title|type|order_index)_?(\d+)/i);
      if (m && m[1]) {
        const num = parseInt(m[1], 10);
        if (!Number.isNaN(num) && num > maxNumberedLevel) {
          maxNumberedLevel = num;
        }
      }
    }

    const maxUnnumberedLevel = Math.max(
      headerMap.get("story_node_title")?.length || 0,
      headerMap.get("node_title")?.length || 0,
      headerMap.get("story_node_type")?.length || 0,
      headerMap.get("node_type")?.length || 0,
      headerMap.get("story_node_order_index")?.length || 0,
      headerMap.get("node_order_index")?.length || 0,
      headerMap.get("story_node_content_content")?.length || 0,
      headerMap.get("story_node_content_image_id")?.length || 0,
      headerMap.get("story_node_content_image_path")?.length || 0,
      headerMap.get("content_image_path")?.length || 0,
      headerMap.get("story_node_content_order_index")?.length || 0,
    );

    const nodeCount = Math.max(maxNumberedLevel, maxUnnumberedLevel);

    // Resolve deleted_status for Story vs Nodes
    storyDeletedStatusCol = getCol([], ["story_deleted_status"]);
    const deletedStatusCols = headerMap.get("deleted_status") || [];
    let nodeDeletedStartIndex = 0;

    if (storyDeletedStatusCol === -1 && deletedStatusCols.length > 0) {
      const nodeColIndices = ["story_node_title", "node_title", "story_node_type", "story_node_order_index"].flatMap((n) => headerMap.get(n) || []);
      const firstNodeCol = nodeColIndices.length > 0 ? Math.min(...nodeColIndices) : Infinity;

      if (deletedStatusCols[0] < firstNodeCol || deletedStatusCols.length > nodeCount) {
        storyDeletedStatusCol = deletedStatusCols[0];
        nodeDeletedStartIndex = 1;
      }
    }

    // Compute anchor column index for each node level (position of story_node_title, type, or order_index)
    const nodeAnchors = [];
    for (let k = 0; k < nodeCount; k++) {
      const num = k + 1;
      const titleCol = getCol(
        [`node_${num}_title`, `story_node_${num}_title`, `story_node_title_${num}`, `node${num}_title`],
        ["story_node_title", "node_title"],
        k,
      );
      const typeCol = getCol([`node_${num}_type`, `story_node_${num}_type`, `story_node_type_${num}`, `node${num}_type`], ["story_node_type", "node_type"], k);
      const orderCol = getCol(
        [`node_${num}_order_index`, `story_node_${num}_order_index`, `story_node_order_index_${num}`, `node${num}_order_index`],
        ["story_node_order_index", "node_order_index"],
        k,
      );
      const validCols = [titleCol, typeCol, orderCol].filter((c) => c !== -1);
      nodeAnchors.push(validCols.length > 0 ? Math.min(...validCols) : k);
    }

    /**
     * Helper to look up a column for a specific node level:
     * - Checks numbered headers first (e.g. node_2_content_content).
     * - Then checks unnumbered headers: if count matches nodeCount, use list[k].
     * - If fewer unnumbered columns than nodeCount, assigns the column to the level whose anchor precedes it.
     */
    const getColForLevel = (numberedNames, unnumberedNames, k) => {
      // 1. Check numbered names (occurrence 0 for this specific level)
      for (const name of numberedNames) {
        const list = headerMap.get(name);
        if (list && list.length > 0) {
          return list[0];
        }
      }
      // 2. Check unnumbered names
      for (const name of unnumberedNames) {
        const list = headerMap.get(name);
        if (!list || list.length === 0) continue;

        if (list.length >= nodeCount) {
          return list[k];
        }

        // Physical block assignment: find which node level this column physically belongs to
        for (const colIdx of list) {
          let assignedLevel = 0;
          for (let idx = 0; idx < nodeAnchors.length; idx++) {
            if (nodeAnchors[idx] <= colIdx) {
              assignedLevel = idx;
            }
          }
          if (assignedLevel === k) {
            return colIdx;
          }
        }
      }
      return -1;
    };

    // Build configuration for each node level (0 to nodeCount - 1)
    for (let k = 0; k < nodeCount; k++) {
      const num = k + 1;
      const titleCol = getColForLevel(
        [`node_${num}_title`, `story_node_${num}_title`, `story_node_title_${num}`, `node${num}_title`],
        ["story_node_title", "node_title"],
        k,
      );
      const typeCol = getColForLevel(
        [`node_${num}_type`, `story_node_${num}_type`, `story_node_type_${num}`, `node${num}_type`],
        ["story_node_type", "node_type"],
        k,
      );
      const orderCol = getColForLevel(
        [`node_${num}_order_index`, `story_node_${num}_order_index`, `story_node_order_index_${num}`, `node${num}_order_index`],
        ["story_node_order_index", "node_order_index"],
        k,
      );

      let deletedCol = getColForLevel(
        [`node_${num}_deleted_status`, `story_node_${num}_deleted_status`],
        ["story_node_deleted_status", "node_deleted_status"],
        k,
      );
      if (deletedCol === -1 && deletedStatusCols.length > 0) {
        if (deletedStatusCols.length >= nodeCount + nodeDeletedStartIndex) {
          deletedCol = deletedStatusCols[nodeDeletedStartIndex + k];
        } else {
          // Check which node level this deleted_status physically belongs to
          for (let dIdx = nodeDeletedStartIndex; dIdx < deletedStatusCols.length; dIdx++) {
            const colIdx = deletedStatusCols[dIdx];
            let assignedLevel = 0;
            for (let idx = 0; idx < nodeAnchors.length; idx++) {
              if (nodeAnchors[idx] <= colIdx) {
                assignedLevel = idx;
              }
            }
            if (assignedLevel === k) {
              deletedCol = colIdx;
              break;
            }
          }
        }
      }

      const cOrderCol = getColForLevel(
        [`story_node_${num}_content_order_index`, `node_${num}_content_order_index`, `content_${num}_order_index`],
        ["story_node_content_order_index", "content_order_index"],
        k,
      );
      const cTypeCol = getColForLevel(
        [`story_node_${num}_content_type`, `node_${num}_content_type`, `content_${num}_type`],
        ["story_node_content_type", "content_type"],
        k,
      );
      const cContentCol = getColForLevel(
        [`story_node_${num}_content_content`, `node_${num}_content_content`, `content_${num}_content`, `story_node_${num}_content`],
        ["story_node_content_content", "story_node_content", "content_content"],
        k,
      );
      const cImageIdCol = getColForLevel(
        [`story_node_${num}_content_image_id`, `node_${num}_content_image_id`, `content_${num}_image_id`],
        ["story_node_content_image_id", "content_image_id"],
        k,
      );
      const cImagePathCol = getColForLevel(
        [
          `story_node_${num}_content_image_path`,
          `node_${num}_content_image_path`,
          `content_${num}_image_path`,
          `story_node_${num}_image_path`,
          `node_${num}_image_path`,
        ],
        ["story_node_content_image_path", "content_image_path", "story_node_image_path", "node_image_path", "image_path"],
        k,
      );
      const cDeletedCol = getColForLevel(
        [`story_node_${num}_content_deleted_status`, `node_${num}_content_deleted_status`, `content_${num}_deleted_status`],
        ["story_node_content_deleted_status", "content_deleted_status"],
        k,
      );

      nodeConfigs.push({
        title: titleCol,
        type: typeCol,
        order_index: orderCol,
        deleted_status: deletedCol,
        content_order_index: cOrderCol,
        content_type: cTypeCol,
        content_content: cContentCol,
        content_image_id: cImageIdCol,
        content_image_path: cImagePathCol,
        content_deleted_status: cDeletedCol,
      });
    }
  } else {
    // Positional fallback for spreadsheets without headers (original 28-column format)
    storyTitleCol = 0;
    storyOtherTitleCol = 1;
    storyTypeCol = 2;
    storyStatusCol = 3;
    nationIdCol = 4;
    nationCol = 5;
    storyDeletedStatusCol = 6;
    isActivedCol = 7;
    summaryCol = 8;
    coverArtIdCol = 9;

    // Node 1 (Parent Node)
    nodeConfigs.push({
      title: 10,
      type: 11,
      order_index: 12,
      deleted_status: 13,
      content_order_index: 14,
      content_type: 15,
      content_content: 16,
      content_image_id: 17,
      content_deleted_status: 18,
    });

    // Node 2 (Child Node)
    nodeConfigs.push({
      title: 19,
      type: 20,
      order_index: 21,
      deleted_status: 22,
      content_order_index: 23,
      content_type: 24,
      content_content: 25,
      content_image_id: 26,
      content_deleted_status: 27,
    });
  }

  const getVal = (row, colIdx) => (colIdx >= 0 && colIdx < row.length ? row[colIdx] : undefined);

  const dataRows = hasHeader ? rawRows.slice(1) : rawRows;
  const result = [];

  for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex++) {
    const row = dataRows[rowIndex];
    if (!row || row.length === 0) continue;

    // Check if entire row is empty
    const isRowEmpty = row.every((cell) => cell === undefined || cell === null || String(cell).trim() === "");
    if (isRowEmpty) continue;

    const title = cleanString(getVal(row, storyTitleCol));
    if (!title) {
      // Story title is required to identify or create a story
      continue;
    }

    const otherTitleRaw = cleanString(getVal(row, storyOtherTitleCol));
    const otherTitles = otherTitleRaw
      ? otherTitleRaw
          .split(/[,;\n|]+/)
          .map((t) => t.trim())
          .filter((t) => t.length > 0)
      : [];

    const genresRaw = cleanString(getVal(row, genresCol));
    const genres = genresRaw
      ? genresRaw
          .split(/[,;\n|]+/)
          .map((g) => g.trim())
          .filter((g) => g.length > 0)
      : [];

    const authorIdsRaw = cleanString(getVal(row, authorIdsCol));
    const authorIds = authorIdsRaw
      ? authorIdsRaw
          .split(/[,;\n|]+/)
          .map((a) => a.trim())
          .filter((a) => a.length > 0)
      : [];

    const storyData = {
      title,
      other_titles: otherTitles,
      type: cleanStoryType(getVal(row, storyTypeCol)),
      status: cleanStoryStatus(getVal(row, storyStatusCol)),
      nation_id: cleanUUID(getVal(row, nationIdCol)),
      nation: cleanString(getVal(row, nationCol)),
      deleted_status: cleanDeletedStatus(getVal(row, storyDeletedStatusCol)),
      is_actived: cleanBoolean(getVal(row, isActivedCol), true),
      summary: cleanString(getVal(row, summaryCol)),
      cover_art_id: cleanUUID(getVal(row, coverArtIdCol)),
      cover_art_path: cleanString(getVal(row, coverArtPathCol)),
      genres,
      author_ids: authorIds,
      authorIds,
    };

    // Scan all detected node levels
    const nodes = [];
    for (let k = 0; k < nodeConfigs.length; k++) {
      const cfg = nodeConfigs[k];
      const nodeTitle = cleanString(getVal(row, cfg.title));
      const nodeTypeRaw = getVal(row, cfg.type);
      const nodeOrder = cleanNumber(getVal(row, cfg.order_index), null);
      const nodeDeleted = getVal(row, cfg.deleted_status);

      const cOrder = cleanNumber(getVal(row, cfg.content_order_index), null);
      const cTypeRaw = getVal(row, cfg.content_type);
      const cContent = cleanString(getVal(row, cfg.content_content));
      const cImageId = cleanUUID(getVal(row, cfg.content_image_id));
      const cImagePath = cleanString(getVal(row, cfg.content_image_path));
      const cDeleted = getVal(row, cfg.content_deleted_status);

      let content = null;
      if (cContent || cImageId || cImagePath || cOrder !== null) {
        content = {
          order_index: cOrder ?? 1,
          type: cleanStoryNodeContentType(cTypeRaw, Boolean(cImageId || cImagePath)),
          content: cContent,
          image_id: cImageId,
          image_path: cImagePath,
          deleted_status: cleanDeletedStatus(cDeleted),
        };
      }

      if (nodeTitle || nodeOrder !== null || content || (nodeTypeRaw && String(nodeTypeRaw).trim())) {
        nodes.push({
          level: k,
          title: nodeTitle,
          type: cleanStoryNodeType(nodeTypeRaw, k === 0 ? "volume" : "chapter"),
          order_index: nodeOrder ?? 1,
          deleted_status: cleanDeletedStatus(nodeDeleted),
          content,
        });
      }
    }

    result.push({
      rowIndex: rowIndex + (hasHeader ? 2 : 1),
      story: storyData,
      nodes,
      parentNode: nodes[0] || null,
      childNode: nodes[1] || null,
    });
  }

  return result;
}

/**
 * Generates sample CSV or XLSX template buffer for batch story import.
 *
 * @param {string} [type="full"] - 'full', 'story_only', or 'chapters_only'
 * @param {string} [format="xlsx"] - 'xlsx' or 'csv'
 * @returns {{ buffer: Buffer, mimeType: string, fileName: string }}
 */
export function generateStoryImportTemplate(type = "full", format = "xlsx") {
  const normType = ["full", "story_only", "chapters_only"].includes(type) ? type : "full";
  const isCsv = format?.toLowerCase() === "csv";

  let headers;
  let sampleRow;

  switch (normType) {
    case "story_only":
      headers = ["title", "other_title", "story_type", "story_status", "nation", "genres", "author_ids", "summary", "is_actived"];
      sampleRow = [
        "One Piece",
        "Vua Hải Tặc",
        "manga",
        "ongoing",
        "Japan",
        "Action,Adventure,Comedy",
        "11111111-1111-4111-8111-111111111111,22222222-2222-4222-8222-222222222222",
        "Hành trình tìm kiếm kho báu One Piece của Monkey D. Luffy.",
        "true",
      ];
      break;

    case "chapters_only":
      headers = ["title", "story_node_title", "story_node_type", "story_node_order_index", "story_node_content_type", "story_node_content_content"];
      sampleRow = ["One Piece", "Chapter 1110", "chapter", 1110, "text", "Nội dung văn bản chương 1110..."];
      break;

    case "full":
    default:
      headers = [
        "title",
        "other_title",
        "story_type",
        "story_status",
        "nation_id",
        "nation",
        "genres",
        "author_ids",
        "deleted_status",
        "is_actived",
        "summary",
        "cover_art_id",
        // Level 1 Node (Parent Node)
        "story_node_title",
        "story_node_type",
        "story_node_order_index",
        "deleted_status",
        "story_node_content_order_index",
        "story_node_content_type",
        "story_node_content_content",
        "story_node_content_image_id",
        "story_node_content_deleted_status",
        // Level 2 Node (Child Node)
        "story_node_title",
        "story_node_type",
        "story_node_order_index",
        "deleted_status",
        "story_node_content_order_index",
        "story_node_content_type",
        "story_node_content_content",
        "story_node_content_image_id",
        "story_node_content_deleted_status",
      ];
      sampleRow = [
        "Solo Leveling",
        "Tôi Thăng Cấp Một Mình, I Alone Level Up",
        "manga",
        "finished",
        "",
        "Korea",
        "Action,Adventure,Fantasy",
        "",
        "not_deleted",
        "true",
        "Thợ săn yếu nhất Sung Jin-woo thức tỉnh sức mạnh vô hạn.",
        "",
        // Level 1: Season 1
        "Season 1",
        "volume",
        1,
        "not_deleted",
        "",
        "",
        "",
        "",
        "",
        // Level 2: Chapter 1
        "Chapter 1",
        "chapter",
        1,
        "not_deleted",
        1,
        "image",
        "",
        "11111111-1111-4111-8111-111111111111",
        "not_deleted",
      ];
      break;
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow]);

  const colWidths = headers.map((h) => ({ wch: Math.max(h.length + 3, 14) }));
  ws["!cols"] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, "Story_Import_Template");

  if (isCsv) {
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "csv" });
    return {
      buffer,
      mimeType: "text/csv; charset=utf-8",
      fileName: `story_template_${normType}.csv`,
    };
  }

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return {
    buffer,
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    fileName: `story_template_${normType}.xlsx`,
  };
}

export default parseStoriesSpreadsheet;
