import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { Button } from "../../ui/button";
import { MoreVertical } from "lucide-react";
import type { RecipeCardProps } from "../../../types";
import { truncate } from "../../../lib/utils/text-formatter";
import { formatDate } from "../../../lib/utils/date-formatter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../ui/alert-dialog";

export function RecipeCard({ recipe, onDelete, onEdit, onView }: Readonly<RecipeCardProps>) {
  const [open, setOpen] = React.useState(false);

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    onView?.(recipe.id);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(recipe.id);
  };

  return (
    <Card className="recipe-card hover:shadow-md transition-shadow cursor-pointer" onClick={handleView}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base leading-tight">{recipe.title}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleView}>View</DropdownMenuItem>
              <DropdownMenuItem onClick={handleEdit}>Edit</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  setOpen(true);
                }}
                className="text-destructive focus:text-destructive"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {recipe.summary && (
          <CardDescription className="text-sm">{truncate(recipe.summary, { length: 100 })}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="pb-4">
        <div className="recipe-tags flex flex-wrap gap-1">
          {recipe.tags.slice(0, 3).map((tag) => (
            <Badge key={tag.id} variant="secondary" className="text-xs">
              {tag.name}
            </Badge>
          ))}
          {recipe.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{recipe.tags.length - 3}
            </Badge>
          )}
          {recipe.tags.length === 0 && <span className="text-xs text-muted-foreground">No tags</span>}
        </div>
      </CardContent>
      <CardFooter className="pt-0 pb-3">
        <span className="text-xs text-muted-foreground">
          Updated {formatDate(recipe.updated_at, { format: "relative" })}
        </span>
      </CardFooter>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recipe?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{recipe.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onDelete?.(recipe.id);
                setOpen(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
