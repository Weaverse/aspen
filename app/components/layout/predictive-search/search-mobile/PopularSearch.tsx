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
    <div className="mx-auto flex max-w-(--page-width) flex-col gap-4">
      <h3 className="font-semibold text-sm uppercase">Popular Searches</h3>
      <ul className="flex flex-col gap-2">
        {popularSearches.map((search, index) => (
          <li key={index}>
            <Link
              to={`/search?q=${encodeURIComponent(search)}`}
              className="hover:-translate-y-1 block w-fit transition-transform duration-200"
            >
              <span className="text-sm">{search}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
