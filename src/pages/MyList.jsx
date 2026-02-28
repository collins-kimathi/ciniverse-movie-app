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
    <main className="px-3 pb-7 pt-4 md:px-10 md:pb-10 md:pt-6">
      <section className="mb-8">
        <h3 className="mb-4 text-xl">My List</h3>
        <MovieGrid movies={list} onSelect={setSelected} emptyMessage="Your list is empty." />
      </section>
      {selected ? <MovieModal movie={selected} onClose={() => setSelected(null)} /> : null}
    </main>
  );
}
