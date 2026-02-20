export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <p>© {year} CINIVERSE. All rights reserved.</p>
    </footer>
  );
}
