import { useRouteError } from "react-router-dom";

export default function ErrorPage() {
  const error = useRouteError();
  console.log(error)

  return (
    <div id="error-page" className="flex h-full w-full items-center justify-center flex-col gap-6">
      <h1>Oops!</h1>
      <p>Sorry, an unexpected error has occurred.</p>
      <p className="opacity-70">
        <i>{error?.message || error?.stack}</i>
      </p>
      <p>{error?.stack?.match(/at \w+/)}</p>

    </div>
  );
}