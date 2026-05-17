// UI component: SkeletonGrid.
export default function SkeletonGrid() {
  return (
    <div className="screen-loader" aria-label="Loading movies" aria-busy="true">
      <div className="cine-loader" aria-hidden="true" />
    </div>
  );
}
