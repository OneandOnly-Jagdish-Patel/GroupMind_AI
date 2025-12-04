import { useState } from "react";
import { Calendar, Trophy, XCircle, Target, ChevronRight } from "lucide-react";
import HistoryDetail from "./HistoryDetail";

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

const mockHistory: DebateHistory[] = [
  {
    id: "1",
    topic: "Should AI be regulated by governments?",
    date: "2024-01-15",
    result: "Won",
    opponent: "Team Alpha",
    finalScore: 85,
    rounds: [
      { name: "Opening", scoreA: 82, scoreB: 75 },
      { name: "Rebuttal", scoreA: 88, scoreB: 80 },
      { name: "Closing", scoreA: 85, scoreB: 78 },
    ],
    aiScores: { logic: 88, evidence: 82, tone: 90, persuasiveness: 85 },
  },
  {
    id: "2",
    topic: "Is social media beneficial for society?",
    date: "2024-01-12",
    result: "Lost",
    opponent: "Team Beta",
    finalScore: 72,
    rounds: [
      { name: "Opening", scoreA: 70, scoreB: 78 },
      { name: "Rebuttal", scoreA: 74, scoreB: 82 },
      { name: "Closing", scoreA: 72, scoreB: 80 },
    ],
    aiScores: { logic: 75, evidence: 70, tone: 78, persuasiveness: 72 },
  },
  {
    id: "3",
    topic: "Should college education be free?",
    date: "2024-01-10",
    result: "Won",
    opponent: "Team Gamma",
    finalScore: 91,
    rounds: [
      { name: "Opening", scoreA: 90, scoreB: 82 },
      { name: "Rebuttal", scoreA: 92, scoreB: 78 },
      { name: "Closing", scoreA: 91, scoreB: 80 },
    ],
    aiScores: { logic: 92, evidence: 90, tone: 88, persuasiveness: 94 },
  },
  {
    id: "4",
    topic: "Remote work vs. Office work",
    date: "2024-01-08",
    result: "Practice",
    opponent: "Solo Practice",
    finalScore: 78,
    rounds: [
      { name: "Opening", scoreA: 76, scoreB: 0 },
      { name: "Rebuttal", scoreA: 80, scoreB: 0 },
      { name: "Closing", scoreA: 78, scoreB: 0 },
    ],
    aiScores: { logic: 80, evidence: 75, tone: 82, persuasiveness: 76 },
  },
  {
    id: "5",
    topic: "Climate change: Individual vs. Corporate responsibility",
    date: "2024-01-05",
    result: "Won",
    opponent: "Team Delta",
    finalScore: 88,
    rounds: [
      { name: "Opening", scoreA: 86, scoreB: 80 },
      { name: "Rebuttal", scoreA: 90, scoreB: 82 },
      { name: "Closing", scoreA: 88, scoreB: 78 },
    ],
    aiScores: { logic: 90, evidence: 88, tone: 85, persuasiveness: 89 },
  },
];

const HistoryList = () => {
  const [selectedDebate, setSelectedDebate] = useState<DebateHistory | null>(null);

  const getResultIcon = (result: string) => {
    switch (result) {
      case "Won":
        return <Trophy className="w-4 h-4 text-success" />;
      case "Lost":
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Target className="w-4 h-4 text-muted-foreground" />;
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
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (selectedDebate) {
    return (
      <HistoryDetail
        debate={selectedDebate}
        onBack={() => setSelectedDebate(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="font-display text-3xl font-bold">Debate History</h1>
          <p className="text-muted-foreground mt-1">Review your past debates and performance</p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Debates", value: mockHistory.length },
            { label: "Wins", value: mockHistory.filter((d) => d.result === "Won").length },
            { label: "Win Rate", value: `${Math.round((mockHistory.filter((d) => d.result === "Won").length / mockHistory.filter((d) => d.result !== "Practice").length) * 100)}%` },
            { label: "Avg Score", value: Math.round(mockHistory.reduce((acc, d) => acc + d.finalScore, 0) / mockHistory.length) },
          ].map((stat, index) => (
            <div key={stat.label} className="card-base p-4 text-center animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
              <p className="text-2xl font-display font-bold gradient-text">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* History List */}
        <div className="card-base overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-display font-semibold">Past Debates</h2>
          </div>

          <div className="divide-y divide-border">
            {mockHistory.map((debate, index) => (
              <button
                key={debate.id}
                onClick={() => setSelectedDebate(debate)}
                className="w-full flex items-center gap-4 p-4 text-left transition-colors hover:bg-secondary/50 animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate mb-1">{debate.topic}</h3>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(debate.date)}
                    </span>
                    <span>vs {debate.opponent}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${getResultStyle(debate.result)}`}>
                    {getResultIcon(debate.result)}
                    {debate.result}
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryList;
