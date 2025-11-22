'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, X, Mail, Copy, Check } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

interface Collaborator {
  id: string;
  email: string;
  name: string;
  isOwner: boolean;
}

interface CollaboratorsListProps {
  tripId: string;
  isOwner: boolean;
}

export default function CollaboratorsList({ tripId, isOwner }: CollaboratorsListProps) {
  const { firebaseUser } = useAppStore();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [owner, setOwner] = useState<Collaborator | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [lastInvitationLink, setLastInvitationLink] = useState<string | null>(null);
  const [showInvitationLink, setShowInvitationLink] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const fetchCollaborators = async () => {
    if (!firebaseUser || !tripId) return;
    
    try {
      setLoading(true);
      const token = await firebaseUser.getIdToken();
      const res = await fetch(`/api/trips/${tripId}/collaborators`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch collaborators');
      }

      const data = await res.json();
      setCollaborators(data.collaborators || []);
      setOwner(data.owner || null);
    } catch (error) {
      console.error('Error fetching collaborators:', error);
      toast.error('Failed to load collaborators');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollaborators();
  }, [tripId, firebaseUser]);

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !firebaseUser) return;

    try {
      setInviting(true);
      const token = await firebaseUser.getIdToken();
      // Use invitations endpoint instead of collaborators endpoint
      const res = await fetch(`/api/trips/${tripId}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to invite collaborator');
      }

      const data = await res.json();
      
      // Check if user was added directly (existing user) or invitation was sent
      if (data.collaboratorId) {
        toast.success('Collaborator added successfully');
        setInviteEmail('');
        setInviteDialogOpen(false);
      } else {
        // Invitation was created - show invitation link in case email wasn't sent
        const invitationLink = data.invitationLink || 
          `${window.location.origin}/invitations/accept?token=${data.invitationToken || 'token'}&tripId=${tripId}`;
        setLastInvitationLink(invitationLink);
        setShowInvitationLink(true);
        
        toast.success('Invitation created!', {
          description: 'Email sent if domain is verified. You can also share the invitation link.',
          duration: 5000,
        });
        
        // Don't close dialog yet - show invitation link
      }
      
      fetchCollaborators();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to invite collaborator';
      toast.error(errorMessage);
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!firebaseUser) return;

    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch(`/api/trips/${tripId}/collaborators/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to remove collaborator');
      }

      toast.success('Collaborator removed successfully');
      fetchCollaborators();
    } catch (error) {
      console.error('Error removing collaborator:', error);
      toast.error('Failed to remove collaborator');
    }
  };

  const allMembers = owner ? [owner, ...collaborators] : collaborators;

  return (
    <Card id="collaborators" className="border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            <CardTitle>Collaborators</CardTitle>
          </div>
          {isOwner && (
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Collaborator</DialogTitle>
                  <DialogDescription>
                    Enter the email address of the user you want to invite to this trip.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {showInvitationLink && lastInvitationLink && (
                    <div className="p-4 bg-muted rounded-lg border-2 border-primary/20">
                      <p className="text-sm font-medium mb-2">Invitation Link Created!</p>
                      <p className="text-xs text-muted-foreground mb-3">
                        {inviteEmail} can use this link to join the trip. Share it if email wasn't sent.
                      </p>
                      <div className="flex items-center gap-2">
                        <Input
                          value={lastInvitationLink}
                          readOnly
                          className="text-xs font-mono"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            await navigator.clipboard.writeText(lastInvitationLink);
                            setLinkCopied(true);
                            setTimeout(() => setLinkCopied(false), 2000);
                          }}
                        >
                          {linkCopied ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      Email Address
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@example.com"
                      value={inviteEmail}
                      onChange={(e) => {
                        setInviteEmail(e.target.value);
                        setShowInvitationLink(false);
                        setLastInvitationLink(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && inviteEmail.trim()) {
                          handleInvite();
                        }
                      }}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setInviteDialogOpen(false);
                      setInviteEmail('');
                      setShowInvitationLink(false);
                      setLastInvitationLink(null);
                    }}
                  >
                    {showInvitationLink ? 'Close' : 'Cancel'}
                  </Button>
                  {!showInvitationLink && (
                    <Button onClick={handleInvite} disabled={!inviteEmail.trim() || inviting}>
                      {inviting ? 'Inviting...' : 'Invite'}
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
        <CardDescription>
          People who have access to view and edit this trip
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4 text-muted-foreground">Loading...</div>
        ) : allMembers.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No collaborators yet
          </div>
        ) : (
          <div className="space-y-3">
            {allMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-background/50 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{member.name}</span>
                      {member.isOwner && (
                        <Badge variant="secondary" className="text-xs">
                          Owner
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {member.email}
                    </div>
                  </div>
                </div>
                {isOwner && !member.isOwner && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(member.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

