interface Props {
  level: number;
  active: boolean;
}

const VoiceVisualizer = ({ level, active }: Props) => {
  const intensity = Math.min(1, Math.max(0, level * 3));
  const base = active ? 30 : 8;
  const h1 = base + intensity * 50;
  const h2 = base + intensity * 70;
  const h3 = base + intensity * 40;

  return (
    <div className="flex items-end gap-2 h-16 px-4 py-2 rounded-lg bg-secondary">
      <div
        style={{ height: `${h1}%` }}
        className="w-2 rounded-full bg-primary transition-all duration-100"
      />
      <div
        style={{ height: `${h2}%` }}
        className="w-2 rounded-full bg-primary transition-all duration-100"
      />
      <div
        style={{ height: `${h3}%` }}
        className="w-2 rounded-full bg-primary transition-all duration-100"
      />
    </div>
  );
};

export default VoiceVisualizer;
