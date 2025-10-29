import { Button } from "@/components/ui/button";
import { Play, Pause, SkipBack, SkipForward, Download, Save } from "lucide-react";
import { useEditorStore } from "@/store/editorStore";

export const EditorHeader = () => {
  const { isPlaying, setIsPlaying, currentTime, duration } = useEditorStore();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <header className="h-16 bg-panel-header border-b border-border flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-foreground">Video Editor Pro</h1>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8"
          onClick={() => {}}
        >
          <SkipBack className="h-4 w-4" />
        </Button>

        <Button
          variant="default"
          size="icon"
          className="h-10 w-10"
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
        </Button>

        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8"
          onClick={() => {}}
        >
          <SkipForward className="h-4 w-4" />
        </Button>

        <div className="ml-4 px-3 py-1 bg-secondary rounded text-sm font-mono">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm">
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
        <Button variant="default" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>
    </header>
  );
};
