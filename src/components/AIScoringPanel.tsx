import { Sparkles, Brain, FileText, Heart, Target } from "lucide-react";

interface Score {
  logic: number;
  evidence: number;
  tone: number;
  persuasiveness: number;
}

interface AIScoringPanelProps {
  scores: Score;
  feedback: string;
  isLoading?: boolean;
  side: "A" | "B";
}

const scoreCategories = [
  { key: "logic", label: "Logic", icon: Brain, color: "from-blue-500 to-blue-600" },
  { key: "evidence", label: "Evidence", icon: FileText, color: "from-emerald-500 to-emerald-600" },
  { key: "tone", label: "Tone", icon: Heart, color: "from-pink-500 to-pink-600" },
  { key: "persuasiveness", label: "Persuasiveness", icon: Target, color: "from-amber-500 to-amber-600" },
];

const AIScoringPanel = ({ scores, feedback, isLoading = false, side }: AIScoringPanelProps) => {
  const totalScore = Math.round(
    (scores.logic + scores.evidence + scores.tone + scores.persuasiveness) / 4
  );

  return (
    <div className="card-base p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">AI Score - Side {side}</h3>
            <p className="text-xs text-muted-foreground">Real-time analysis</p>
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl font-bold gradient-text">{totalScore}</div>
          <div className="text-xs text-muted-foreground">/ 100</div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="text-sm animate-pulse-soft">Scoring in progress...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Score Bars */}
          <div className="space-y-3 mb-4">
            {scoreCategories.map((category) => {
              const Icon = category.icon;
              const score = scores[category.key as keyof Score];

              return (
                <div key={category.key}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium">{category.label}</span>
                    </div>
                    <span className="text-xs font-semibold">{score}</span>
                  </div>
                  <div className="score-bar">
                    <div
                      className={`score-bar-fill bg-gradient-to-r ${category.color}`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Feedback */}
          <div className="p-3 rounded-lg bg-secondary/50">
            <p className="text-xs text-muted-foreground font-medium mb-1">AI Feedback</p>
            <p className="text-sm leading-relaxed">{feedback}</p>
          </div>
        </>
      )}
    </div>
  );
};

export default AIScoringPanel;
