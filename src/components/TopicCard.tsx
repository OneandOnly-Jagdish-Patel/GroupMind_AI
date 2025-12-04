import { Users } from "lucide-react";

interface Props {
  id: string;
  title: string;
  description: string;
  participants: number;
  onJoin: (id: string) => void;
  onSpectate: (id: string) => void;
  onDelete?: (id: string) => void;
  isAdmin?: boolean;
}

const TopicCard = ({
  id,
  title,
  description,
  participants,
  onJoin,
  onSpectate,
  onDelete,
  isAdmin = false
}: Props) => {
  const roomFull = participants >= 2;

  return (
    <div className="card-base p-6 rounded-xl card-hover">
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>

      <div className="flex items-center gap-2 text-sm mb-4">
        <Users className="w-4 h-4" />
        <span>{participants} joined</span>
        <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs">
          Live
        </span>
      </div>

      <div className="flex gap-3">
        <button
          disabled={roomFull}
          onClick={() => onJoin(id)}
          className={`flex-1 px-4 py-2 rounded-lg font-semibold transition ${
            roomFull
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-primary text-primary-foreground hover:opacity-90"
          }`}
        >
          {roomFull ? "Room Full" : "Join Debate"}
        </button>

        <button
          onClick={() => onSpectate(id)}
          className="flex-1 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold transition"
        >
          Spectate
        </button>

        {isAdmin && (
          <button
            onClick={() => onDelete?.(id)}
            className="px-4 py-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 font-semibold transition"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

export default TopicCard;
