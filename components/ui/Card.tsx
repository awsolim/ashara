type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-[28px] border border-black/5 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.05)] ${className}`}
    >
      {children}
    </div>
  );
}