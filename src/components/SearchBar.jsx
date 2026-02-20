import { useState } from "react";

export default function SearchBar({ onSearch }) {
  const [query, setQuery] = useState("");

  function submit(event) {
    event.preventDefault();
    onSearch(query);
  }

  return (
    <form onSubmit={submit} className="search-form">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search movies"
        aria-label="Search movies"
      />
      <button type="submit">Search</button>
    </form>
  );
}
