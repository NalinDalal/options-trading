import { type JSX } from "react";

/**
 * Performs  card operation.
 * @param {{ className?: string; title: string; children: React.ReactNode; href: string; }} {
 *   className,
 *   title,
 *   children,
 *   href,
 * } - Description of {
 *   className,
 *   title,
 *   children,
 *   href,
 * }
 * @returns {React.JSX.Element} Description of return value
 */
export function Card({
  className,
  title,
  children,
  href,
}: {
  className?: string;
  title: string;
  children: React.ReactNode;
  href: string;
}): JSX.Element {
  return (
    <a
      className={className}
      href={`${href}?utm_source=create-turbo&utm_medium=basic&utm_campaign=create-turbo"`}
      rel="noopener noreferrer"
      target="_blank"
    >
      <h2>
        {title} <span>-&gt;</span>
      </h2>
      <p>{children}</p>
    </a>
  );
}
