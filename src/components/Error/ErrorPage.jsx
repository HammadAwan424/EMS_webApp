import { useRouteError , Link } from "react-router-dom";


export default function ErrorPage() {
  const error = useRouteError();
  console.log(error)

  const permissionDenied = error.code == 'permission-denied'


  return (
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
}