import { type JSX } from "react";

/**
 * Performs  code operation.
 * @param {{ children: React.ReactNode; className?: string; }} {
 *   children,
 *   className,
 * } - Description of {
 *   children,
 *   className,
 * }
 * @returns {React.JSX.Element} Description of return value
 */
export function Code({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}): JSX.Element {
  return <code className={className}>{children}</code>;
}
