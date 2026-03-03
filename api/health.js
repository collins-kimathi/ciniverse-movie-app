// Health check endpoint for deployment monitoring.
export default function handler(_req, res) {
  res.status(200).json({ ok: true });
}

