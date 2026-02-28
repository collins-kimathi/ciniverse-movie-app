export default function SectionError({ message, onRetry }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <p className="my-2 text-sm text-red-400">{message}</p>
      <button
        type="button"
        className="cursor-pointer rounded-full border border-white/20 bg-white/8 px-3 py-1.5 text-sm font-semibold text-[var(--text)] transition hover:bg-white/18"
        onClick={onRetry}
      >
        Retry
      </button>
    </div>
  );
}
