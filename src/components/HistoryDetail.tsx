import { ArrowLeft, Calendar, Trophy, XCircle, Target, Brain, FileText, Heart } from "lucide-react";

interface DebateHistory {
  id: string;
  topic: string;
  date: string;
  result: "Won" | "Lost" | "Practice";
  opponent: string;
  finalScore: number;
  rounds: {
    name: string;
    scoreA: number;
    scoreB: number;
  }[];
  aiScores: {
    logic: number;
    evidence: number;
    tone: number;
    persuasiveness: number;
  };
}

interface HistoryDetailProps {
  debate: DebateHistory;
  onBack: () => void;
}

const HistoryDetail = ({ debate, onBack }: HistoryDetailProps) => {
  const getResultIcon = (result: string) => {
    switch (result) {
      case "Won":
        return <Trophy className="w-5 h-5 text-success" />;
      case "Lost":
        return <XCircle className="w-5 h-5 text-destructive" />;
      default:
        return <Target className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getResultStyle = (result: string) => {
    switch (result) {
      case "Won":
        return "bg-success/10 text-success border-success/20";
      case "Lost":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const scoreCategories = [
    { key: "logic", label: "Logic", icon: Brain, color: "from-blue-500 to-blue-600" },
    { key: "evidence", label: "Evidence", icon: FileText, color: "from-emerald-500 to-emerald-600" },
    { key: "tone", label: "Tone", icon: Heart, color: "from-pink-500 to-pink-600" },
    { key: "persuasiveness", label: "Persuasiveness", icon: Target, color: "from-amber-500 to-amber-600" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to History
          </button>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold">{debate.topic}</h1>
              <div className="flex items-center gap-3 mt-2 text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(debate.date)}
                </span>
                <span>vs {debate.opponent}</span>
              </div>
            </div>

            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${getResultStyle(debate.result)}`}>
              {getResultIcon(debate.result)}
              {debate.result}
            </div>
          </div>
        </div>

        {/* Final Score */}
        <div className="card-base p-6 text-center mb-8 animate-slide-up">
          <p className="text-sm text-muted-foreground mb-2">Final Score</p>
          <p className="font-display text-5xl font-bold gradient-text">{debate.finalScore}</p>
          <p className="text-muted-foreground mt-1">out of 100</p>
        </div>

        {/* Round by Round */}
        <div className="card-base mb-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <div className="p-4 border-b border-border">
            <h2 className="font-display font-semibold">Round Summary</h2>
          </div>

          <div className="divide-y divide-border">
            {debate.rounds.map((round, index) => (
              <div key={index} className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{round.name}</h3>
                  <p className="text-sm text-muted-foreground">Round {index + 1}</p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">You</p>
                    <p className={`font-display text-xl font-bold ${round.scoreA > round.scoreB ? "text-success" : round.scoreA < round.scoreB ? "text-destructive" : "text-foreground"}`}>
                      {round.scoreA}
                    </p>
                  </div>
                  <div className="text-muted-foreground">vs</div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Opponent</p>
                    <p className="font-display text-xl font-bold text-muted-foreground">
                      {round.scoreB || "-"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Scores Breakdown */}
        <div className="card-base p-6 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <h2 className="font-display font-semibold mb-6">AI Score Breakdown</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {scoreCategories.map((category) => {
              const Icon = category.icon;
              const score = debate.aiScores[category.key as keyof typeof debate.aiScores];

              return (
                <div key={category.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-medium">{category.label}</span>
                    </div>
                    <span className="font-display text-xl font-bold">{score}</span>
                  </div>
                  <div className="score-bar h-3">
                    <div
                      className={`score-bar-fill bg-gradient-to-r ${category.color}`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryDetail;
