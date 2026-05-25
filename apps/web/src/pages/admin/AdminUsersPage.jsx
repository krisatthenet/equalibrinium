import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient';
import AdminLayout from '@/components/AdminLayout.jsx';
import { useToast } from '@/hooks/use-toast';
import { Search, ShieldBan, ShieldCheck, Trash2, MoreVertical, Loader2, BadgeCheck, Phone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PlanBadge from '@/components/PlanBadge.jsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // Modals state
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [banReason, setBanReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const records = await pb.collection('users').getFullList({
        sort: '-created',
        $autoCancel: false
      });
      setUsers(records);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({ title: "Error", description: "Failed to load users.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleBanUser = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await pb.collection('users').update(selectedUser.id, {
        banned: true,
        ban_reason: banReason,
        ban_date: new Date().toISOString()
      }, { $autoCancel: false });
      
      toast({ title: "User Banned", description: `${selectedUser.email} has been banned.` });
      setBanModalOpen(false);
      setBanReason('');
      fetchUsers();
    } catch (error) {
      toast({ title: "Error", description: "Failed to ban user.", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnbanUser = async (user) => {
    if (!window.confirm(`Are you sure you want to unban ${user.email}?`)) return;
    try {
      await pb.collection('users').update(user.id, {
        banned: false,
        ban_reason: '',
        ban_date: ''
      }, { $autoCancel: false });
      toast({ title: "User Unbanned", description: `${user.email} has been unbanned.` });
      fetchUsers();
    } catch (error) {
      toast({ title: "Error", description: "Failed to unban user.", variant: "destructive" });
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`CRITICAL: Are you sure you want to permanently delete ${user.email}? This cannot be undone.`)) return;
    try {
      await pb.collection('users').delete(user.id, { $autoCancel: false });
      toast({ title: "User Deleted", description: "User has been permanently removed." });
      fetchUsers();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete user.", variant: "destructive" });
    }
  };

  const handleToggleIdVerified = async (user) => {
    const next = !user.idVerified;
    const action = next ? 'ID-verify' : 'remove ID verification from';
    if (!window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${user.email}?`)) return;
    try {
      await pb.collection('users').update(user.id, { idVerified: next }, { $autoCancel: false });
      toast({ title: next ? "ID Verified" : "ID Verification Removed", description: `${user.email} updated.` });
      fetchUsers();
    } catch {
      toast({ title: "Error", description: "Failed to update ID verification.", variant: "destructive" });
    }
  };

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <AdminLayout>
      <Helmet>
        <title>Manage Users - Admin Portal</title>
      </Helmet>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Users</h1>
          <p className="text-muted-foreground mt-1">Manage platform users and permissions.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search users..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="admin-input pl-9"
          />
        </div>
      </div>

      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-[hsl(var(--admin-border))/50] border-b border-[hsl(var(--admin-border))]">
              <tr>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Joined</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--admin-border))]">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-muted-foreground">
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-[hsl(var(--admin-border))/30] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{user.name || 'Unnamed User'}</span>
                          {user.title && <Badge variant="secondary" className="text-xs">{user.title}</Badge>}
                          <PlanBadge plan={user.plan} />
                        </div>
                        <span className="text-muted-foreground">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="capitalize border-[hsl(var(--admin-border))] text-gray-300">
                        {user.role === 'admin' ? 'Admin' : (user.userType || 'User')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {user.banned ? (
                          <Badge className="bg-destructive/20 text-destructive hover:bg-destructive/30 border-none w-fit">Banned</Badge>
                        ) : user.verified ? (
                          <Badge className="bg-[hsl(var(--admin-success))]/20 text-[hsl(var(--admin-success))] hover:bg-[hsl(var(--admin-success))]/30 border-none w-fit">Email ✓</Badge>
                        ) : (
                          <Badge className="bg-[hsl(var(--admin-warning))]/20 text-[hsl(var(--admin-warning))] hover:bg-[hsl(var(--admin-warning))]/30 border-none w-fit">Unverified</Badge>
                        )}
                        {user.idVerified && (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-none w-fit flex items-center gap-1">
                            <BadgeCheck className="h-3 w-3" /> ID ✓
                          </Badge>
                        )}
                        {user.phoneVerified && (
                          <Badge className="bg-sky-500/20 text-sky-400 border-none w-fit flex items-center gap-1">
                            <Phone className="h-3 w-3" /> Phone ✓
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(user.created).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[hsl(var(--admin-card))] border-[hsl(var(--admin-border))]">
                          {user.banned ? (
                            <DropdownMenuItem onClick={() => handleUnbanUser(user)} className="text-[hsl(var(--admin-success))] focus:text-[hsl(var(--admin-success))] focus:bg-[hsl(var(--admin-success))]/10 cursor-pointer">
                              <ShieldCheck className="h-4 w-4 mr-2" /> Unban User
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => { setSelectedUser(user); setBanModalOpen(true); }} className="text-[hsl(var(--admin-warning))] focus:text-[hsl(var(--admin-warning))] focus:bg-[hsl(var(--admin-warning))]/10 cursor-pointer">
                              <ShieldBan className="h-4 w-4 mr-2" /> Ban User
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleToggleIdVerified(user)} className="text-emerald-400 focus:text-emerald-400 focus:bg-emerald-500/10 cursor-pointer">
                            <BadgeCheck className="h-4 w-4 mr-2" />
                            {user.idVerified ? 'Remove ID Verification' : 'Mark ID Verified'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteUser(user)} className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer">
                            <Trash2 className="h-4 w-4 mr-2" /> Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ban Modal */}
      <Dialog open={banModalOpen} onOpenChange={setBanModalOpen}>
        <DialogContent className="bg-[hsl(var(--admin-card))] border-[hsl(var(--admin-border))] text-foreground">
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Are you sure you want to ban {selectedUser?.email}? They will no longer be able to access the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-gray-300">Reason for ban</Label>
              <Textarea 
                id="reason" 
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Enter reason for moderation logs..."
                className="admin-input min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanModalOpen(false)} disabled={actionLoading} className="border-[hsl(var(--admin-border))] text-foreground hover:bg-[hsl(var(--admin-border))]">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBanUser} disabled={actionLoading || !banReason.trim()}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Ban
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminUsersPage;