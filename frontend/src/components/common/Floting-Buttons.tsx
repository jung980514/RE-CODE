import { Button } from "@/components/ui/button"
import { SearchIcon as SearchPlus, MousePointer2, Keyboard } from "lucide-react"

export function FloatingButtons() {
  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-50">
      <Button
        variant="outline"
        size="icon"
        className="rounded-full w-12 h-12 shadow-md bg-white hover:bg-gray-50"
        aria-label="Search"
      >
        <SearchPlus className="h-6 w-6" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="rounded-full w-12 h-12 shadow-md bg-white hover:bg-gray-50"
        aria-label="Mouse Pointer"
      >
        <MousePointer2 className="h-6 w-6" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="rounded-full w-12 h-12 shadow-md bg-white hover:bg-gray-50"
        aria-label="Keyboard"
      >
        <Keyboard className="h-6 w-6" />
      </Button>
    </div>
  )
}