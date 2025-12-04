import { useState } from "react";
import { Trophy, Medal, Award, ChevronDown } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  debates: number;
  winRate: number;
}

const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, name: "Alex Johnson", score: 2450, debates: 32, winRate: 78 },
  { rank: 2, name: "Sarah Chen", score: 2380, debates: 28, winRate: 75 },
  { rank: 3, name: "Mike Williams", score: 2290, debates: 35, winRate: 71 },
  { rank: 4, name: "Emily Davis", score: 2150, debates: 24, winRate: 70 },
  { rank: 5, name: "James Wilson", score: 2080, debates: 30, winRate: 67 },
  { rank: 6, name: "Lisa Anderson", score: 1950, debates: 22, winRate: 68 },
  { rank: 7, name: "David Brown", score: 1890, debates: 26, winRate: 65 },
  { rank: 8, name: "Anna Martinez", score: 1820, debates: 20, winRate: 65 },
  { rank: 9, name: "Chris Taylor", score: 1750, debates: 18, winRate: 61 },
  { rank: 10, name: "Rachel Lee", score: 1680, debates: 21, winRate: 62 },
];

const Leaderboard = () => {
  const [filter, setFilter] = useState("all");

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return (
          <span className="w-5 h-5 flex items-center justify-center text-sm font-semibold text-muted-foreground">
            {rank}
          </span>
        );
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200";
      case 2:
        return "bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200";
      case 3:
        return "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200";
      default:
        return "bg-card border-border";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="animate-fade-in">
            <h1 className="font-display text-3xl font-bold">Leaderboard</h1>
            <p className="text-muted-foreground mt-1">Top debaters ranked by performance</p>
          </div>

          {/* Filter */}
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input-base pr-10 appearance-none cursor-pointer"
            >
              <option value="all">All Debates</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Top 3 Podium */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {/* 2nd Place */}
          <div className="card-base p-4 text-center mt-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center mx-auto mb-2">
              <Medal className="w-6 h-6 text-gray-600" />
            </div>
            <h3 className="font-semibold truncate">{mockLeaderboard[1].name}</h3>
            <p className="text-2xl font-display font-bold text-muted-foreground">{mockLeaderboard[1].score}</p>
            <p className="text-xs text-muted-foreground">2nd Place</p>
          </div>

          {/* 1st Place */}
          <div className="card-base p-4 text-center bg-gradient-to-b from-yellow-50 to-card border-yellow-200 animate-slide-up">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center mx-auto mb-2">
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <h3 className="font-semibold truncate">{mockLeaderboard[0].name}</h3>
            <p className="text-3xl font-display font-bold gradient-text">{mockLeaderboard[0].score}</p>
            <p className="text-xs text-muted-foreground">1st Place</p>
          </div>

          {/* 3rd Place */}
          <div className="card-base p-4 text-center mt-8 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-200 to-orange-300 flex items-center justify-center mx-auto mb-2">
              <Award className="w-6 h-6 text-amber-700" />
            </div>
            <h3 className="font-semibold truncate">{mockLeaderboard[2].name}</h3>
            <p className="text-2xl font-display font-bold text-muted-foreground">{mockLeaderboard[2].score}</p>
            <p className="text-xs text-muted-foreground">3rd Place</p>
          </div>
        </div>

        {/* Full Leaderboard */}
        <div className="card-base overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-display font-semibold">All Rankings</h2>
          </div>

          <div className="divide-y divide-border">
            {mockLeaderboard.map((entry, index) => (
              <div
                key={entry.rank}
                className={`flex items-center gap-4 p-4 transition-colors hover:bg-secondary/50 ${getRankStyle(entry.rank)} border-l-4 animate-fade-in`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="w-8 flex items-center justify-center">
                  {getRankIcon(entry.rank)}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{entry.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {entry.debates} debates · {entry.winRate}% win rate
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-display text-xl font-bold">{entry.score.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">points</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
