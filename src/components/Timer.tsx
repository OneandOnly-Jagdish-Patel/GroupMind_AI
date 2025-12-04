import { useState, useEffect, useCallback } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

interface TimerProps {
  initialSeconds?: number;
  onTimeUp?: () => void;
}

const Timer = ({ initialSeconds = 90, onTimeUp }: TimerProps) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);

  const formatTime = useCallback((totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            onTimeUp?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, seconds, onTimeUp]);

  const handleReset = () => {
    setSeconds(initialSeconds);
    setIsRunning(false);
  };

  const progress = (seconds / initialSeconds) * 100;
  const isLow = seconds <= 30;
  const isCritical = seconds <= 10;

  return (
    <div className="flex items-center gap-4">
      {/* Timer Display */}
      <div className="relative">
        <div
          className={`font-display text-3xl font-bold tabular-nums ${
            isCritical
              ? "text-destructive animate-pulse"
              : isLow
              ? "text-warning"
              : "text-foreground"
          }`}
        >
          {formatTime(seconds)}
        </div>

        {/* Progress Bar */}
        <div className="mt-2 h-1 w-24 rounded-full bg-secondary overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-linear ${
              isCritical
                ? "bg-destructive"
                : isLow
                ? "bg-warning"
                : "bg-gradient-to-r from-primary to-accent"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
          aria-label={isRunning ? "Pause" : "Start"}
        >
          {isRunning ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={handleReset}
          className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
          aria-label="Reset"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Timer;
