import { useState } from "react";
import { Plus, X, Users, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Debate {
  id: string;
  title: string;
  description: string;
  debaters: number;
  spectators: number;
}

interface DashboardProps {
  userName: string;
}

const Dashboard = ({ userName }: DashboardProps) => {
  const navigate = useNavigate();
  const [debates, setDebates] = useState<Debate[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", description: "" });

  const isAdmin = userName.toLowerCase() === "admin";

  const createDebate = () => {
    if (!form.title.trim()) return;

    const debate: Debate = {
      id: Date.now().toString(),
      title: form.title.trim(),
      description: form.description.trim(),
      debaters: 0,
      spectators: 0
    };

    setDebates((prev) => [...prev, debate]);
    setForm({ title: "", description: "" });
    setShowModal(false);
  };

  const joinAsDebater = (id: string) => {
    setDebates((prev) => {
      const updated = prev.map((d) => {
        if (d.id !== id) return d;
        if (d.debaters >= 2) return d;
        return { ...d, debaters: d.debaters + 1 };
      });
      const selected = updated.find((d) => d.id === id);
      if (selected && selected.debaters <= 2) {
        const role = selected.debaters === 1 ? "debater_A" : "debater_B";
        navigate(`/debate/${id}`, {
          state: { debate: selected, role }
        });
      }
      return updated;
    });
  };

  const joinAsSpectator = (id: string) => {
    setDebates((prev) => {
      const updated = prev.map((d) =>
        d.id === id ? { ...d, spectators: d.spectators + 1 } : d
      );
      const selected = updated.find((d) => d.id === id);
      if (selected) {
        navigate(`/debate/${id}`, {
          state: { debate: selected, role: "spectator" }
        });
      }
      return updated;
    });
  };

  const deleteDebate = (id: string) => {
    setDebates((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-8">Welcome, {userName}</h1>

        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2 px-6 py-3 mb-8"
        >
          <Plus className="w-5 h-5" />
          Start Debate
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {debates.map((debate, index) => {
            const participants = debate.debaters + debate.spectators;
            const roomFull = debate.debaters >= 2;

            return (
              <div
                key={debate.id}
                className="animate-slide-up card-base p-6 flex flex-col justify-between"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div>
                  <h2 className="font-display text-lg font-bold">
                    {debate.title}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-2">
                    {debate.description || "Live 1v1 AI debate room"}
                  </p>
                </div>

                <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {participants} joined
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Live
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => joinAsDebater(debate.id)}
                    disabled={roomFull}
                    className={`flex-1 px-4 py-2 rounded-lg font-semibold transition ${
                      roomFull
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-primary text-primary-foreground hover:opacity-90"
                    }`}
                  >
                    {roomFull ? "Room Full" : "Join Debate"}
                  </button>

                  <button
                    onClick={() => joinAsSpectator(debate.id)}
                    className="flex-1 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold transition"
                  >
                    Spectate
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => deleteDebate(debate.id)}
                      className="px-4 py-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 font-semibold transition"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="card-base w-full max-w-lg p-6 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-secondary"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold mb-6">Create New Debate</h2>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Debate Title"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                className="input-base"
              />

              <textarea
                placeholder="Description"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                className="input-base min-h-[120px] resize-none"
              />

              <button
                onClick={createDebate}
                className="btn-primary w-full py-3"
              >
                Create Debate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
