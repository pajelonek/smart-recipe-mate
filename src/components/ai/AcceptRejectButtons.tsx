import { Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";

interface AcceptRejectButtonsProps {
  readonly onAccept: () => Promise<void>;
  readonly onReject: () => void;
  readonly isSaving: boolean;
}

export function AcceptRejectButtons({ onAccept, onReject, isSaving }: AcceptRejectButtonsProps) {
  return (
    <CardFooter className="flex gap-3">
      <Button type="button" variant="outline" className="flex-1" onClick={onReject} disabled={isSaving}>
        <X className="mr-2 h-4 w-4" />
        Odrzuć
      </Button>
      <Button type="button" className="flex-1" onClick={onAccept} disabled={isSaving}>
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Zapisywanie...
          </>
        ) : (
          <>
            <Check className="mr-2 h-4 w-4" />
            Akceptuj przepis
          </>
        )}
      </Button>
    </CardFooter>
  );
}
