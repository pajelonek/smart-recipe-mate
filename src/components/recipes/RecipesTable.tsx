import { useState } from "react";
import { MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";
import { formatDate } from "@/lib/utils/date-formatter";
import type { Recipe } from "@/types";

interface RecipesTableProps {
  readonly recipes: Recipe[];
  readonly isLoading: boolean;
  readonly onDelete: (id: string) => void;
  readonly onView?: (id: string) => void;
}

export function RecipesTable({ recipes, isLoading, onDelete, onView }: Readonly<RecipesTableProps>) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleRowClick = (recipeId: string) => {
    window.location.href = `/recipes/${recipeId}`;
  };

  const handleView = (recipeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onView) {
      onView(recipeId);
    } else {
      handleRowClick(recipeId);
    }
  };

  const handleEdit = (recipeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `/recipes/${recipeId}/edit`;
  };

  const handleDeleteClick = (recipeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(recipeId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deletingId) {
      try {
        onDelete(deletingId);
        setDeleteDialogOpen(false);
        setDeletingId(null);
      } catch {
        // Error is already handled by the hook
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDeletingId(null);
  };

  if (isLoading) {
    return null; // Loading state should be handled by parent
  }

  if (recipes.length === 0) {
    return null; // Empty state should be handled by parent
  }

  return (
    <>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="whitespace-nowrap">Created</TableHead>
              <TableHead className="whitespace-nowrap">Updated</TableHead>
              <TableHead className="w-[50px]">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recipes.map((recipe) => (
              <TableRow key={recipe.id} className="cursor-pointer" onClick={() => handleRowClick(recipe.id)}>
                <TableCell className="font-medium">{recipe.title}</TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                  {formatDate(recipe.created_at)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                  {formatDate(recipe.updated_at)}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm">
                        <MoreHorizontal className="size-4" />
                        <span className="sr-only">Open actions menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => handleView(recipe.id, e)}>
                        <Eye className="mr-2 size-4" />
                        <span>View</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => handleEdit(recipe.id, e)}>
                        <Edit className="mr-2 size-4" />
                        <span>Edit</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onClick={(e) => handleDeleteClick(recipe.id, e)}>
                        <Trash2 className="mr-2 size-4" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleDeleteCancel();
          }
        }}
      >
        <AlertDialogContent title="Are you sure?">
          This action cannot be undone. This will permanently delete the recipe.
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={handleDeleteCancel}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              className="px-4 py-2 text-sm font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-md"
            >
              Delete
            </button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
