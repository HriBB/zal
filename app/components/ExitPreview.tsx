import { useEffect, useState } from 'react'

// Floating "Izhod iz predogleda" button. Shown only when the page is the top
// window (not inside the Studio iframe). Posts to /resource/preview to
// destroy the preview session cookie.
export function ExitPreview() {
  // Start true to match server render (renders null), then check after hydration.
  const [inIframe, setInIframe] = useState(true)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInIframe(window.self !== window.top)
  }, [])

  if (inIframe) return null

  return (
    <div className="pointer-events-none fixed inset-0 flex h-dvh w-screen items-end justify-end p-2">
      <form className="pointer-events-auto" action="/resource/preview" method="POST">
        <button
          type="submit"
          className="bg-zal rounded-md px-4 py-3 text-sm font-semibold leading-none text-white shadow-lg"
        >
          Izhod iz predogleda
        </button>
      </form>
    </div>
  )
}
