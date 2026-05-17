// UI component: SkeletonRow.
export default function SkeletonRow() {
  return (
    <section className="screen-loader" aria-label="Loading movie row" aria-busy="true">
      <div className="cine-loader" aria-hidden="true" />
    </section>
  );
}
