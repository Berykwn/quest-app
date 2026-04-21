import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff } from "lucide-react";

export default function PublishedBadge({ isPublished }: { isPublished: boolean }) {
    return (
        <Badge
            className={`flex items-center gap-1 shadow-none ${isPublished
                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-100'
                }`}
        >
            {isPublished ? (
                <>
                    <Eye className="w-3 h-3" />
                    Published
                </>
            ) : (
                <>
                    <EyeOff className="w-3 h-3" />
                    Draft
                </>
            )}
        </Badge>
    )
}