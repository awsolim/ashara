type ProgressBarProps = {
  value: number;
};

export default function ProgressBar({ value }: ProgressBarProps) {
  return (
    <div className="h-2.5 w-full rounded-full bg-[#e5ddd2]">
      <div
        className="h-2.5 rounded-full bg-[#1f5c4c] transition-all"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}