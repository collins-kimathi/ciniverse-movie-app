import { useEffect, useState } from "react";
import MovieGrid from "../components/MovieGrid";
import MovieModal from "../components/MovieModal";
import { readMyList } from "../utils/library";

export default function MyList({ watchTarget = null, onConsumeWatchTarget = () => {} }) {
  const [list, setList] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setList(readMyList());
  }, [selected]);

  useEffect(() => {
    if (!watchTarget) {
      return;
    }
    setSelected({ id: watchTarget.id, mediaType: watchTarget.mediaType });
    onConsumeWatchTarget();
  }, [watchTarget, onConsumeWatchTarget]);

  return (
    <main className="main">
      <section className="rail-section">
        <h3>My List</h3>
        <MovieGrid movies={list} onSelect={setSelected} emptyMessage="Your list is empty." />
      </section>
      {selected ? <MovieModal movie={selected} onClose={() => setSelected(null)} /> : null}
    </main>
  );
}
