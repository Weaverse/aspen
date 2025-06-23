import { Link } from "react-router";

export function PopularSearch() {
  let popularSearches = [
    "chair",
    "barrel chair",
    "play chair",
    "ourf chair",
    "balcony chair",
  ];

  return (
    <div className="flex flex-col gap-4 max-w-(--page-width) mx-auto">
      <h3 className="text-sm font-semibold uppercase">
        Popular Searches
      </h3>
      <ul className="flex flex-col gap-2">
        {popularSearches.map((search, index) => (
          <li key={index}>
            <Link
              to={`/search?q=${encodeURIComponent(search)}`}
              className="block transition-transform duration-200 hover:-translate-y-1 w-fit"
            >
                <span className="text-sm">{search}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}