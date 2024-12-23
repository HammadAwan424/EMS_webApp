import { useRouteError, Link } from "react-router-dom";

export default function ErrorPage() {
  const error = useRouteError();
  const isDev = import.meta.env.DEV
  const permissionDenied = error.code == 'permission-denied'

  return (
    isDev ? (
      <div id="error-page" className="flex h-full w-full items-center justify-center flex-col gap-6">
      <h1>Oops!</h1>
      <p>Sorry, an unexpected error has occurred.</p>
      <p className="opacity-70">
        <i>{error?.message || error?.stack}</i>
      </p>
      <p>{error?.stack?.match(/at \w+/)}</p>

    </div>
    ) : (
      <div className="flex flex-col items-center justify-center h-full">
      {permissionDenied ? (
        <>
          <div className="font-bold text-5xl pb-2">Oops</div>
          <div className="font-semibold">You are requesting resouce that doesn't belong to you</div>
          <span className="font-medium">Go Back <Link to="/">Home</Link></span>
        </>
      ) : (
        <>
          <div className="font-bold text-5xl pb-2">Oops</div>
          <div className="font-semibold">Some unexpected error has occured</div>
          <span className="font-medium">Go Back <Link to="/">Home</Link></span>
        </>
      )}
    </div>
    )

  );
}