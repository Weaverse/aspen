import { type LoaderFunctionArgs, redirect } from "react-router";

export const loader = ({ params }: LoaderFunctionArgs) => {
  const localePrefix = params.locale ? `/${params.locale}` : "";
  return redirect(`${localePrefix}/blogs`, 301);
};

export default function LegacyBlogListing() {
  return null;
}
