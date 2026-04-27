export type UserRole = "owner" | "admin" | "manager" | "viewer";
export interface User {
    id: string;
    companyId: string;
    email: string;
    name: string;
    role: UserRole;
    status?: "active" | "inactive";
    createdAt: FirebaseFirestore.Timestamp;
    lastActive?: FirebaseFirestore.Timestamp;
}
export interface TeamMember {
    userId: string;
    email: string;
    name: string;
    role: UserRole;
    joinedAt: FirebaseFirestore.Timestamp;
    lastActive?: FirebaseFirestore.Timestamp;
}
export interface AuditLog {
    id: string;
    userId: string;
    action: "role_changed" | "member_added" | "member_removed" | "invite_sent";
    targetUserId?: string;
    changes: Record<string, unknown>;
    timestamp: FirebaseFirestore.Timestamp;
}
//# sourceMappingURL=types.d.ts.map