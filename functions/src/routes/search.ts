import * as admin from "firebase-admin";
import { Router, Response } from "express";
import { AuthenticatedRequest, hasPermission } from "../middleware/auth";

const router = Router();
const db = admin.firestore();

interface SearchFilters {
  status?: string[];
  priority?: string[];
  boardId?: string[];
  category?: string[];
  assignedTo?: string;
  dateRange?: {
    from: string;
    to: string;
  };
}

router.post(
  "/api/search/submissions",
  hasPermission(["submissions:read"]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const companyId = req.companyId;
      const {
        query = "",
        filters = {},
        page = 1,
        pageSize = 50,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.body;

      if (!companyId) {
        res.status(401).json({ error: "Company not found" });
        return;
      }

      let query_: FirebaseFirestore.Query = db
        .collection("submissions")
        .where("companyId", "==", companyId);

      // Apply filters
      const f = filters as SearchFilters;

      if (f.status && f.status.length > 0) {
        query_ = query_.where("status", "in", f.status);
      }

      if (f.priority && f.priority.length > 0) {
        query_ = query_.where("priority", "in", f.priority);
      }

      if (f.boardId && f.boardId.length > 0) {
        query_ = query_.where("boardId", "in", f.boardId);
      }

      if (f.category && f.category.length > 0) {
        query_ = query_.where("category", "in", f.category);
      }

      if (f.assignedTo) {
        query_ = query_.where("assignedTo", "==", f.assignedTo);
      }

      if (f.dateRange) {
        const from = new Date(f.dateRange.from);
        const to = new Date(f.dateRange.to);
        query_ = query_
          .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(from))
          .where("createdAt", "<=", admin.firestore.Timestamp.fromDate(to));
      }

      // Get total count before pagination
      const totalSnapshot = await query_.get();
      let results = totalSnapshot.docs.map((doc) => doc.data());

      // Full-text search on client side (since Firestore doesn't support full-text search)
      if (query.trim()) {
        const searchLower = query.toLowerCase();
        results = results.filter(
          (submission) =>
            submission.subject?.toLowerCase().includes(searchLower) ||
            submission.description?.toLowerCase().includes(searchLower) ||
            submission.category?.toLowerCase().includes(searchLower) ||
            submission.trackingCode?.toLowerCase().includes(searchLower),
        );
      }

      // Sort
      results.sort((a, b) => {
        let aVal: number | string = 0;
        let bVal: number | string = 0;

        if (sortBy === "createdAt") {
          aVal = a.createdAt?.toDate?.()?.getTime?.() || 0;
          bVal = b.createdAt?.toDate?.()?.getTime?.() || 0;
        } else if (sortBy === "priority") {
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          aVal = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          bVal = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
        } else if (sortBy === "status") {
          aVal = a.status || "";
          bVal = b.status || "";
        } else {
          aVal = a[sortBy] || "";
          bVal = b[sortBy] || "";
        }

        if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
        if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });

      // Pagination
      const totalCount = results.length;
      const pageNum = Math.max(1, page);
      const pageSizeNum = Math.min(pageSize || 50, 100);
      const startIdx = (pageNum - 1) * pageSizeNum;
      const paginatedResults = results.slice(startIdx, startIdx + pageSizeNum);

      const submissions = paginatedResults.map((data) => ({
        id: data.id,
        trackingCode: data.trackingCode,
        subject: data.subject,
        description: data.description,
        status: data.status,
        priority: data.priority,
        category: data.category,
        boardId: data.boardId,
        assignedTo: data.assignedTo,
        createdAt: data.createdAt?.toDate?.()?.toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString(),
      }));

      res.json({
        results: submissions,
        pagination: {
          page: pageNum,
          pageSize: pageSizeNum,
          total: totalCount,
          totalPages: Math.ceil(totalCount / pageSizeNum),
        },
      });
    } catch (error) {
      console.error("Search submissions error:", error);
      res.status(500).json({ error: "Failed to search submissions" });
    }
  },
);

router.post(
  "/api/search/export-csv",
  hasPermission(["submissions:read"]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const companyId = req.companyId;
      const { filters = {} } = req.body;

      if (!companyId) {
        res.status(401).json({ error: "Company not found" });
        return;
      }

      let query_: FirebaseFirestore.Query = db
        .collection("submissions")
        .where("companyId", "==", companyId);

      // Apply filters
      const f = filters as SearchFilters;

      if (f.status && f.status.length > 0) {
        query_ = query_.where("status", "in", f.status);
      }

      if (f.priority && f.priority.length > 0) {
        query_ = query_.where("priority", "in", f.priority);
      }

      if (f.boardId && f.boardId.length > 0) {
        query_ = query_.where("boardId", "in", f.boardId);
      }

      if (f.dateRange) {
        const from = new Date(f.dateRange.from);
        const to = new Date(f.dateRange.to);
        query_ = query_
          .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(from))
          .where("createdAt", "<=", admin.firestore.Timestamp.fromDate(to));
      }

      const snapshot = await query_.get();
      const submissions = snapshot.docs.map((doc) => doc.data());

      // CSV headers
      const headers = [
        "ID",
        "Tracking Code",
        "Subject",
        "Description",
        "Category",
        "Status",
        "Priority",
        "Assigned To",
        "Created At",
        "Updated At",
      ];

      // CSV rows
      const rows = submissions.map((sub) => [
        sub.id,
        sub.trackingCode,
        `"${(sub.subject || "").replace(/"/g, '""')}"`,
        `"${(sub.description || "").replace(/"/g, '""')}"`,
        sub.category || "",
        sub.status || "",
        sub.priority || "",
        sub.assignedTo || "",
        sub.createdAt?.toDate?.()?.toISOString() || "",
        sub.updatedAt?.toDate?.()?.toISOString() || "",
      ]);

      const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="submissions.csv"',
      );
      res.send(csv);
    } catch (error) {
      console.error("Export CSV error:", error);
      res.status(500).json({ error: "Failed to export CSV" });
    }
  },
);

export default router;
