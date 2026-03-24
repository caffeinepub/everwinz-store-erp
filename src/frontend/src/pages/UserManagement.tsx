import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Shield,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";
import { useState } from "react";
import { type AppUser, type NewUser, useAuth } from "../auth";

const ROLE_LABELS: Record<AppUser["role"], string> = {
  admin: "Admin",
  store_manager: "Store Manager",
  engineer: "Engineer",
  accounts: "Accounts",
};

const ROLE_COLORS: Record<AppUser["role"], string> = {
  admin: "bg-purple-100 text-purple-800 border-purple-200",
  store_manager: "bg-blue-100 text-blue-800 border-blue-200",
  engineer: "bg-orange-100 text-orange-800 border-orange-200",
  accounts: "bg-green-100 text-green-800 border-green-200",
};

const BUILT_IN_USERNAMES = ["admin", "store", "engineer"];

const MAX_USERS = 50;

interface FormState {
  username: string;
  displayName: string;
  password: string;
  role: AppUser["role"];
}

const emptyForm: FormState = {
  username: "",
  displayName: "",
  password: "",
  role: "engineer",
};

export default function UserManagement() {
  const { users, addUser, updateUser, deleteUser } = useAuth();
  const [addOpen, setAddOpen] = useState(false);
  const [editUser, setEditUser] = useState<AppUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");

  const atLimit = users.length >= MAX_USERS;

  const openAdd = () => {
    setForm(emptyForm);
    setFormError("");
    setShowPassword(false);
    setAddOpen(true);
  };

  const openEdit = (u: AppUser) => {
    setEditUser(u);
    setForm({
      username: u.username,
      displayName: u.displayName,
      password: "",
      role: u.role,
    });
    setFormError("");
    setShowPassword(false);
  };

  const handleAddSubmit = () => {
    if (!form.username.trim()) {
      setFormError("Username is required.");
      return;
    }
    if (!form.displayName.trim()) {
      setFormError("Display name is required.");
      return;
    }
    if (!form.password.trim()) {
      setFormError("Password is required.");
      return;
    }
    const res = addUser({
      ...form,
      username: form.username.trim().toLowerCase(),
    } as NewUser);
    if (!res.success) {
      setFormError(res.error || "Failed to add user.");
      return;
    }
    setAddOpen(false);
  };

  const handleEditSubmit = () => {
    if (!editUser) return;
    if (!form.displayName.trim()) {
      setFormError("Display name is required.");
      return;
    }
    const updates: Partial<NewUser> = {
      displayName: form.displayName,
      role: form.role,
    };
    if (form.password.trim()) updates.password = form.password;
    const res = updateUser(editUser.username, updates);
    if (!res.success) {
      setFormError(res.error || "Failed to update user.");
      return;
    }
    setEditUser(null);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteUser(deleteTarget.username);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="text-blue-700" size={26} />
            User Management
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage who can access the Everwinz Store ERP system.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            data-ocid="users.count_badge"
            className={`text-sm font-semibold px-3 py-1 rounded-full border ${
              atLimit
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-blue-50 text-blue-700 border-blue-200"
            }`}
          >
            {users.length} / {MAX_USERS} users
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    data-ocid="users.add_button"
                    onClick={openAdd}
                    disabled={atLimit}
                    className="bg-blue-700 hover:bg-blue-800 text-white"
                  >
                    <Plus size={16} className="mr-1" />
                    Add User
                  </Button>
                </span>
              </TooltipTrigger>
              {atLimit && (
                <TooltipContent>
                  <p>
                    Maximum of {MAX_USERS} users reached. Delete a user to add
                    more.
                  </p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Default login note */}
      <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800">
        <Shield size={15} className="shrink-0" />
        <span>
          Default login: <strong>admin</strong> / <strong>admin123</strong> —
          this account cannot be deleted.
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-12 font-semibold text-gray-700">
                  #
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Username
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Display Name
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Role
                </TableHead>
                <TableHead className="font-semibold text-gray-700 text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u, i) => (
                <TableRow
                  key={u.username}
                  data-ocid={`users.item.${i + 1}`}
                  className="hover:bg-gray-50"
                >
                  <TableCell className="text-gray-400 text-sm">
                    {i + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {u.displayName[0]}
                      </div>
                      <span className="font-medium text-gray-900">
                        {u.username}
                      </span>
                      {u.username === "admin" && (
                        <span className="text-xs text-gray-400">(default)</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-700">
                    {u.displayName}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${ROLE_COLORS[u.role]}`}
                    >
                      {ROLE_LABELS[u.role]}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        data-ocid={`users.edit_button.${i + 1}`}
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(u)}
                        className="text-blue-700 hover:bg-blue-50 h-8 px-2"
                      >
                        <Pencil size={14} className="mr-1" />
                        Edit
                      </Button>
                      {!BUILT_IN_USERNAMES.includes(u.username) && (
                        <Button
                          data-ocid={`users.delete_button.${i + 1}`}
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(u)}
                          className="text-red-600 hover:bg-red-50 h-8 px-2"
                        >
                          <Trash2 size={14} className="mr-1" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add User Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md" data-ocid="users.dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck size={18} className="text-blue-700" />
              Add New User
            </DialogTitle>
            <DialogDescription>
              Create a new login account for the ERP system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="add-username">Username</Label>
              <Input
                data-ocid="users.input"
                id="add-username"
                placeholder="e.g. john.doe"
                value={form.username}
                onChange={(e) =>
                  setForm((p) => ({ ...p, username: e.target.value }))
                }
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="add-display">Display Name</Label>
              <Input
                id="add-display"
                placeholder="e.g. John Doe"
                value={form.displayName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, displayName: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="add-password">Password</Label>
              <div className="relative">
                <Input
                  id="add-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, password: e.target.value }))
                  }
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select
                value={form.role}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, role: v as AppUser["role"] }))
                }
              >
                <SelectTrigger data-ocid="users.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="store_manager">Store Manager</SelectItem>
                  <SelectItem value="engineer">Engineer</SelectItem>
                  <SelectItem value="accounts">Accounts</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formError && (
              <p
                data-ocid="users.error_state"
                className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2"
              >
                {formError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              data-ocid="users.cancel_button"
              variant="outline"
              onClick={() => setAddOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="users.submit_button"
              onClick={handleAddSubmit}
              className="bg-blue-700 hover:bg-blue-800 text-white"
            >
              Add User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent className="sm:max-w-md" data-ocid="users.edit_dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil size={18} className="text-blue-700" />
              Edit User
            </DialogTitle>
            <DialogDescription>
              Update the details for <strong>{editUser?.username}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-username">Username</Label>
              <Input
                id="edit-username"
                value={editUser?.username || ""}
                disabled
                className="bg-gray-50 text-gray-500"
              />
              <p className="text-xs text-gray-400">
                Username cannot be changed.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-display">Display Name</Label>
              <Input
                id="edit-display"
                value={form.displayName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, displayName: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-password">
                New Password{" "}
                <span className="text-gray-400">
                  (leave blank to keep current)
                </span>
              </Label>
              <div className="relative">
                <Input
                  id="edit-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Leave blank to keep current"
                  value={form.password}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, password: e.target.value }))
                  }
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {editUser?.username !== "admin" && (
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select
                  value={form.role}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, role: v as AppUser["role"] }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="store_manager">Store Manager</SelectItem>
                    <SelectItem value="engineer">Engineer</SelectItem>
                    <SelectItem value="accounts">Accounts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {formError && (
              <p
                data-ocid="users.edit_error_state"
                className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2"
              >
                {formError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              data-ocid="users.edit_cancel_button"
              variant="outline"
              onClick={() => setEditUser(null)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="users.save_button"
              onClick={handleEditSubmit}
              className="bg-blue-700 hover:bg-blue-800 text-white"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-sm" data-ocid="users.delete_dialog">
          <DialogHeader>
            <DialogTitle className="text-red-700 flex items-center gap-2">
              <Trash2 size={18} />
              Delete User
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deleteTarget?.displayName}</strong> (
              {deleteTarget?.username})? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              data-ocid="users.delete_cancel_button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="users.confirm_button"
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
