import { useEffect, useState } from 'react'

const MOBILE_MAX = 767
const TABLET_MAX = 1023

export function useResponsive() {
  const [width, setWidth] = useState(() => window.innerWidth)

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return {
    width,
    isMobile: width <= MOBILE_MAX,
    isTablet: width > MOBILE_MAX && width <= TABLET_MAX,
    isTabletOrDown: width <= TABLET_MAX,
  }
}
