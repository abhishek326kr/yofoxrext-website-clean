"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Upload, Image as ImageIcon, FileText, Video, Trash2, Eye } from "lucide-react";

interface MediaFile {
  id: string;
  filename: string;
  url: string;
  type: string;
  altText?: string;
  tags?: string[];
  usageCount?: number;
}

interface Revision {
  id: string;
  revisionNumber: number;
  changedBy: string;
  changedFields?: string[];
  timestamp: string;
}

export default function ContentStudio() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState("all");
  const [isEditMediaOpen, setIsEditMediaOpen] = useState(false);
  const [deleteMediaId, setDeleteMediaId] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [contentType, setContentType] = useState("");
  const [contentId, setContentId] = useState("");
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [selectedRevision, setSelectedRevision] = useState<Revision | null>(null);

  const { data: mediaFilesRaw, isLoading: mediaLoading } = useQuery<MediaFile[]>({
    queryKey: ["/api/admin/content-studio/media", searchQuery, fileTypeFilter]
  });

  const mediaFiles = Array.isArray(mediaFilesRaw) ? mediaFilesRaw : [];

  const { data: revisionsRaw, isLoading: revisionsLoading } = useQuery<Revision[]>({
    queryKey: ["/api/admin/content-studio/revisions", contentType, contentId],
    enabled: !!contentType && !!contentId
  });

  const revisions = Array.isArray(revisionsRaw) ? revisionsRaw : [];

  const uploadMediaMutation = useMutation({
    mutationFn: (data: FormData) => apiRequest("/api/admin/content-studio/media/upload", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content-studio/media"] });
      toast({ title: "Media uploaded successfully" });
    }
  });

  const updateMediaMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/admin/content-studio/media/${data.id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content-studio/media"] });
      toast({ title: "Media updated successfully" });
      setIsEditMediaOpen(false);
    }
  });

  const deleteMediaMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/admin/content-studio/media/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content-studio/media"] });
      toast({ title: "Media deleted successfully" });
      setDeleteMediaId(null);
    }
  });

  const restoreRevisionMutation = useMutation({
    mutationFn: (revisionId: string) => 
      apiRequest(`/api/admin/content-studio/revisions/${revisionId}/restore`, "POST"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content-studio/revisions"] });
      toast({ title: "Revision restored successfully" });
      setIsRestoreOpen(false);
    }
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      uploadMediaMutation.mutate(formData);
    }
  };

  const handleUpdateMedia = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const tags = (formData.get("tags") as string).split(",").map(t => t.trim()).filter(Boolean);
    updateMediaMutation.mutate({
      id: selectedMedia?.id,
      altText: formData.get("altText"),
      tags
    });
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="w-4 h-4" />;
    if (type.startsWith("video/")) return <Video className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Content Studio</h1>

      <Tabs defaultValue="media" className="space-y-4">
        <TabsList>
          <TabsTrigger value="media" data-testid="tab-media">Media Library</TabsTrigger>
          <TabsTrigger value="revisions" data-testid="tab-revisions">Content Revisions</TabsTrigger>
        </TabsList>

        <TabsContent value="media" className="space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <h2 className="text-xl font-semibold">Media Library</h2>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
                data-testid="input-search-media"
              />
              <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
                <SelectTrigger className="w-40" data-testid="select-file-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="images">Images</SelectItem>
                  <SelectItem value="documents">Documents</SelectItem>
                  <SelectItem value="videos">Videos</SelectItem>
                </SelectContent>
              </Select>
              <Button asChild data-testid="button-upload-media">
                <label className="cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload File
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    accept="image/*,video/*,.pdf,.doc,.docx"
                  />
                </label>
              </Button>
            </div>
          </div>

          {mediaLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-64" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {mediaFiles.map((media) => (
                <Card key={media.id} data-testid={`media-card-${media.id}`}>
                  <CardHeader className="p-0">
                    <div className="aspect-video bg-muted rounded-t-lg flex items-center justify-center overflow-hidden">
                      {media.type?.startsWith("image/") ? (
                        <img
                          src={media.url}
                          alt={media.altText || media.filename}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          {getFileIcon(media.type)}
                          <span className="text-xs">{media.type}</span>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-2">
                    <div className="font-medium truncate" data-testid={`media-filename-${media.id}`}>
                      {media.filename}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {media.tags?.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Used {media.usageCount || 0} times
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedMedia(media);
                        setIsEditMediaOpen(true);
                      }}
                      data-testid={`button-edit-media-${media.id}`}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeleteMediaId(media.id)}
                      data-testid={`button-delete-media-${media.id}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
              {mediaFiles.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  No media files found
                </div>
              )}
            </div>
          )}

          <Dialog open={isEditMediaOpen} onOpenChange={setIsEditMediaOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Media</DialogTitle>
              </DialogHeader>
              {selectedMedia && (
                <form onSubmit={handleUpdateMedia} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="altText">Alt Text</Label>
                    <Input
                      id="altText"
                      name="altText"
                      defaultValue={selectedMedia.altText}
                      data-testid="input-alt-text"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      name="tags"
                      defaultValue={selectedMedia.tags?.join(", ")}
                      placeholder="tag1, tag2, tag3"
                      data-testid="input-tags"
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={updateMediaMutation.isPending} data-testid="button-save-media">
                      {updateMediaMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>

          <AlertDialog open={!!deleteMediaId} onOpenChange={(open) => !open && setDeleteMediaId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Media</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this media file? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteMediaId && deleteMediaMutation.mutate(deleteMediaId)}
                  data-testid="button-confirm-delete"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>

        <TabsContent value="revisions" className="space-y-4">
          <h2 className="text-xl font-semibold">Content Revisions</h2>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contentType">Content Type</Label>
                  <Select value={contentType} onValueChange={setContentType}>
                    <SelectTrigger data-testid="select-content-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="thread">Thread</SelectItem>
                      <SelectItem value="comment">Comment</SelectItem>
                      <SelectItem value="content">Content</SelectItem>
                      <SelectItem value="user">User Profile</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contentId">Content ID</Label>
                  <Input
                    id="contentId"
                    value={contentId}
                    onChange={(e) => setContentId(e.target.value)}
                    placeholder="Enter content ID"
                    data-testid="input-content-id"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {contentType && contentId && (
            <Card>
              <CardHeader>
                <CardTitle>Revision History</CardTitle>
              </CardHeader>
              <CardContent>
                {revisionsLoading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Revision #</TableHead>
                          <TableHead>Changed By</TableHead>
                          <TableHead>Changed Fields</TableHead>
                          <TableHead>Timestamp</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {revisions.map((revision) => (
                          <TableRow key={revision.id} data-testid={`revision-${revision.id}`}>
                            <TableCell>
                              <Badge variant="secondary">#{revision.revisionNumber}</Badge>
                            </TableCell>
                            <TableCell>{revision.changedBy}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {revision.changedFields?.map((field, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {field}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              {formatDistanceToNow(new Date(revision.timestamp), { addSuffix: true })}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  data-testid={`button-view-diff-${revision.id}`}
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  View Diff
                                </Button>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => {
                                    setSelectedRevision(revision);
                                    setIsRestoreOpen(true);
                                  }}
                                  data-testid={`button-restore-${revision.id}`}
                                >
                                  Restore
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {revisions.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                              No revisions found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <AlertDialog open={isRestoreOpen} onOpenChange={setIsRestoreOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Restore Revision</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to restore this revision? This will overwrite the current content with revision #{selectedRevision?.revisionNumber}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-testid="button-cancel-restore">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => selectedRevision && restoreRevisionMutation.mutate(selectedRevision.id)}
                  data-testid="button-confirm-restore"
                >
                  Restore
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}
