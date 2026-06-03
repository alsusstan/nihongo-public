import { useState, useEffect } from 'react'

function getInitialIsMobile(breakpoint) {
  if (typeof window === 'undefined') return false
  return window.innerWidth <= breakpoint
}

export function useIsMobile(breakpoint = 600) {
  const [isMobile, setIsMobile] = useState(() => getInitialIsMobile(breakpoint))

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    if (!window.matchMedia) {
      const handler = () => setIsMobile(getInitialIsMobile(breakpoint))
      window.addEventListener('resize', handler)
      handler()
      return () => window.removeEventListener('resize', handler)
    }

    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`)
    const handler = (e) => setIsMobile(e.matches)
    if (mq.addEventListener) {
      mq.addEventListener('change', handler)
    } else {
      mq.addListener(handler)
    }
    setIsMobile(mq.matches)
    return () => {
      if (mq.removeEventListener) {
        mq.removeEventListener('change', handler)
      } else {
        mq.removeListener(handler)
      }
    }
  }, [breakpoint])

  return isMobile
}

export function useIsTablet() {
  const [isTablet, setIsTablet] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia('(min-width: 700px) and (max-width: 1366px), (pointer: coarse) and (min-width: 700px) and (max-width: 1700px)').matches
  })

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined
    const mq = window.matchMedia('(min-width: 700px) and (max-width: 1366px), (pointer: coarse) and (min-width: 700px) and (max-width: 1700px)')
    const handler = (e) => setIsTablet(e.matches)
    if (mq.addEventListener) {
      mq.addEventListener('change', handler)
    } else {
      mq.addListener(handler)
    }
    setIsTablet(mq.matches)
    return () => {
      if (mq.removeEventListener) {
        mq.removeEventListener('change', handler)
      } else {
        mq.removeListener(handler)
      }
    }
  }, [])

  return isTablet
}
