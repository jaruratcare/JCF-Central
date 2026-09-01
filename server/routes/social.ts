import { Router } from "express";
import { supabase } from "../supabaseClient";

const router = Router();

// Helper to get PR Department ID
async function getPRDepartmentId(): Promise<string> {
  const { data: dept } = await supabase
    .from("departments")
    .select("id")
    .eq("slug", "pr")
    .single();

  return dept?.id || "610ca264-68cb-409f-8a2d-75bdc79f1d20";
}

// Helper to transform DB social record to frontend format
const transformSocial = (dbRecord: any) => {
  let status = "Published";
  if (dbRecord.record_type === "campaign") {
    status = "Live";
  } else if (!dbRecord.published_at) {
    status = "Draft";
  } else if (new Date(dbRecord.published_at) > new Date()) {
    status = "Scheduled";
  }

  const reachNum = dbRecord.reach || 0;
  const reachFormatted = reachNum >= 1000 ? `${(reachNum / 1000).toFixed(1)}K` : String(reachNum);

  const engNum = dbRecord.engagement || 0;
  const engFormatted = engNum > 0 ? `${engNum} interactions` : "0";

  return {
    id: dbRecord.id,
    post: dbRecord.title,
    channel: dbRecord.platform || "LinkedIn",
    post_date: dbRecord.published_at ? dbRecord.published_at.split("T")[0] : (dbRecord.created_at ? dbRecord.created_at.split("T")[0] : "Draft"),
    reach: reachFormatted,
    raw_reach: reachNum,
    engagement: engFormatted,
    raw_engagement: engNum,
    status,
    url: dbRecord.url || "",
    record_type: dbRecord.record_type,
    created_at: dbRecord.created_at,
  };
};

// GET social records (scoped to PR department)
router.get("/", async (req, res) => {
  try {
    const prDeptId = await getPRDepartmentId();
    const { search } = req.query;

    let query = supabase
      .from("social_media_records")
      .select("*")
      .eq("department_id", prDeptId)
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(
        `title.ilike.%${search}%,platform.ilike.%${search}%`
      );
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json((data || []).map(transformSocial));
  } catch (error: any) {
    console.error("GET /api/social error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET single social record
router.get("/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("social_media_records")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (error) throw error;
    res.json(transformSocial(data));
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

// CREATE social record
router.post("/", async (req, res) => {
  try {
    const prDeptId = await getPRDepartmentId();
    const {
      post,
      channel = "LinkedIn",
      reach = 0,
      engagement = 0,
      status = "Published",
      post_date,
      url = "",
    } = req.body;

    if (!post || !post.trim()) {
      return res.status(400).json({ error: "Post title / content is required" });
    }

    let parseReach = 0;
    if (typeof reach === "string") {
      parseReach = parseFloat(reach.replace(/[^0-9.]/g, "")) * (reach.toLowerCase().includes("k") ? 1000 : 1) || 0;
    } else if (typeof reach === "number") {
      parseReach = reach;
    }

    let parseEng = 0;
    if (typeof engagement === "string") {
      parseEng = parseInt(engagement.replace(/[^0-9]/g, ""), 10) || 0;
    } else if (typeof engagement === "number") {
      parseEng = engagement;
    }

    const recordType = status === "Live" || status === "Campaign" ? "campaign" : "post";
    const publishedAt = status === "Draft" ? null : (post_date || new Date().toISOString());

    const dbRecord = {
      department_id: prDeptId,
      title: post.trim(),
      platform: channel.trim(),
      record_type: recordType,
      reach: Math.round(parseReach),
      engagement: Math.round(parseEng),
      published_at: publishedAt,
      url: url.trim() || null,
    };

    const { data, error } = await supabase
      .from("social_media_records")
      .insert(dbRecord)
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(transformSocial(data));
  } catch (error: any) {
    console.error("POST /api/social error:", error);
    res.status(500).json({ error: error.message });
  }
});

// UPDATE social record
router.put("/:id", async (req, res) => {
  try {
    const dbRecord: any = {
      updated_at: new Date().toISOString(),
    };

    if (req.body.post !== undefined) dbRecord.title = req.body.post.trim();
    if (req.body.channel !== undefined) dbRecord.platform = req.body.channel.trim();
    if (req.body.url !== undefined) dbRecord.url = req.body.url.trim() || null;

    if (req.body.reach !== undefined) {
      const reach = req.body.reach;
      let parseReach = 0;
      if (typeof reach === "string") {
        parseReach = parseFloat(reach.replace(/[^0-9.]/g, "")) * (reach.toLowerCase().includes("k") ? 1000 : 1) || 0;
      } else {
        parseReach = Number(reach) || 0;
      }
      dbRecord.reach = Math.round(parseReach);
    }

    if (req.body.engagement !== undefined) {
      const eng = req.body.engagement;
      let parseEng = 0;
      if (typeof eng === "string") {
        parseEng = parseInt(eng.replace(/[^0-9]/g, ""), 10) || 0;
      } else {
        parseEng = Number(eng) || 0;
      }
      dbRecord.engagement = Math.round(parseEng);
    }

    if (req.body.status !== undefined) {
      dbRecord.record_type = req.body.status === "Live" || req.body.status === "Campaign" ? "campaign" : "post";
      if (req.body.status === "Draft") {
        dbRecord.published_at = null;
      } else if (!dbRecord.published_at && req.body.post_date) {
        dbRecord.published_at = req.body.post_date;
      }
    }

    if (req.body.post_date !== undefined && req.body.status !== "Draft") {
      dbRecord.published_at = req.body.post_date || null;
    }

    const { data, error } = await supabase
      .from("social_media_records")
      .update(dbRecord)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(transformSocial(data));
  } catch (error: any) {
    console.error("PUT /api/social/:id error:", error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE social record
router.delete("/:id", async (req, res) => {
  try {
    const { error } = await supabase
      .from("social_media_records")
      .delete()
      .eq("id", req.params.id);

    if (error) throw error;
    res.json({ message: "Social record deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/social/:id error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;