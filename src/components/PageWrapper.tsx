import { ReactNode, CSSProperties } from "react";

interface PageWrapperProps {
  children: ReactNode;
  /** Remove horizontal padding (e.g. for cover images / full-bleed sections). */
  noPadding?: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * Standard page content wrapper.
 *
 * Every screen renders inside this so that:
 *  - 56 px top bar offset is reserved (padding-top)
 *  - 72 px bottom nav offset is reserved (padding-bottom)
 *  - Width is capped at 480 px (mobile-first shell)
 *  - Vertical scroll is allowed; horizontal scroll is clipped
 *
 * Pages must NOT set their own min-height / overflow / fixed positioning
 * — let this wrapper handle it.
 */
const PageWrapper = ({ children, noPadding = false, className = "", style }: PageWrapperProps) => (
  <div
    className={className}
    style={{
      paddingTop: 56,
      paddingBottom: 72,
      paddingLeft: noPadding ? 0 : 16,
      paddingRight: noPadding ? 0 : 16,
      minHeight: "100vh",
      width: "100%",
      maxWidth: 480,
      boxSizing: "border-box",
      overflowY: "auto",
      overflowX: "hidden",
      margin: "0 auto",
      ...style,
    }}
  >
    {children}
  </div>
);

export default PageWrapper;
