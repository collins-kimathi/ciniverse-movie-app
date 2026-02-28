export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--border)] bg-black/30 px-4 py-4 text-center text-[var(--muted)] md:px-10">
      <p>&copy; {year} CINIVERSE. All rights reserved.</p>
    </footer>
  );
}
