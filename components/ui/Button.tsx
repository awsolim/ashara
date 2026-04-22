type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
};

export default function Button({
  children,
  onClick,
  disabled = false,
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="
        w-full rounded-2xl px-4 py-4 text-base font-medium tracking-tight transition
        bg-[#1f5c4c] text-white shadow-[0_8px_20px_rgba(31,92,76,0.18)]
        hover:bg-[#194d40]
        active:scale-[0.985]
        disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500 disabled:shadow-none
      "
    >
      {children}
    </button>
  );
}