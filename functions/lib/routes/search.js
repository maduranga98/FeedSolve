"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const admin = __importStar(require("firebase-admin"));
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const db = admin.firestore();
router.post("/api/search/submissions", (0, auth_1.hasPermission)(["submissions:read"]), async (req, res) => {
    try {
        const companyId = req.companyId;
        const { query = "", filters = {}, page = 1, pageSize = 50, sortBy = "createdAt", sortOrder = "desc", } = req.body;
        if (!companyId) {
            res.status(401).json({ error: "Company not found" });
            return;
        }
        let query_ = db
            .collection("submissions")
            .where("companyId", "==", companyId);
        // Apply filters
        const f = filters;
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
            results = results.filter((submission) => submission.subject?.toLowerCase().includes(searchLower) ||
                submission.description?.toLowerCase().includes(searchLower) ||
                submission.category?.toLowerCase().includes(searchLower) ||
                submission.trackingCode?.toLowerCase().includes(searchLower));
        }
        // Sort
        results.sort((a, b) => {
            let aVal = 0;
            let bVal = 0;
            if (sortBy === "createdAt") {
                aVal = a.createdAt?.toDate?.()?.getTime?.() || 0;
                bVal = b.createdAt?.toDate?.()?.getTime?.() || 0;
            }
            else if (sortBy === "priority") {
                const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
                aVal = priorityOrder[a.priority] || 0;
                bVal = priorityOrder[b.priority] || 0;
            }
            else if (sortBy === "status") {
                aVal = a.status || "";
                bVal = b.status || "";
            }
            else {
                aVal = a[sortBy] || "";
                bVal = b[sortBy] || "";
            }
            if (aVal < bVal)
                return sortOrder === "asc" ? -1 : 1;
            if (aVal > bVal)
                return sortOrder === "asc" ? 1 : -1;
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
    }
    catch (error) {
        console.error("Search submissions error:", error);
        res.status(500).json({ error: "Failed to search submissions" });
    }
});
router.post("/api/search/export-csv", (0, auth_1.hasPermission)(["submissions:read"]), async (req, res) => {
    try {
        const companyId = req.companyId;
        const { filters = {} } = req.body;
        if (!companyId) {
            res.status(401).json({ error: "Company not found" });
            return;
        }
        let query_ = db
            .collection("submissions")
            .where("companyId", "==", companyId);
        // Apply filters
        const f = filters;
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
        res.setHeader("Content-Disposition", 'attachment; filename="submissions.csv"');
        res.send(csv);
    }
    catch (error) {
        console.error("Export CSV error:", error);
        res.status(500).json({ error: "Failed to export CSV" });
    }
});
exports.default = router;
//# sourceMappingURL=search.js.map