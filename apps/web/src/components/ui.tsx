"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { ArrowUpRight, Check, LoaderCircle, RefreshCw, X } from "lucide-react";
import Link from "next/link";
import { safeUrl } from "../lib/api";
export function Avatar({
  name,
  url,
  size = 40,
}: {
  name: string;
  url?: string;
  size?: number;
}) {
  return (
    <span
      className="avatar"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.32,
        flexShrink: 0,
      }}
    >
      {safeUrl(url) ? (
        <img
          src={safeUrl(url)}
          alt=""
          width={size}
          height={size}
          loading="lazy"
        />
      ) : (
        name
          .split(" ")
          .slice(0, 2)
          .map((part) => part[0])
          .join("")
      )}
    </span>
  );
}
export function Verified() {
  return (
    <span title="Verified" className="verified">
      <Check size={9} strokeWidth={3} />
    </span>
  );
}
export function Empty({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-mark">↗</span>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}
export function ErrorState({
  error,
  retry,
}: {
  error: string;
  retry: () => void;
}) {
  return (
    <div className="error-state" role="alert">
      <p>{error}</p>
      <button className="button secondary" onClick={retry}>
        <RefreshCw size={15} />
        Try again
      </button>
    </div>
  );
}
export function Loading({ cards = 2 }: { cards?: number }) {
  return (
    <div aria-label="Loading content" aria-busy="true">
      {Array.from({ length: cards }, (_, i) => (
        <div className="skeleton-card" key={i}>
          <div className="skeleton skeleton-heading" />
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-media" />
        </div>
      ))}
    </div>
  );
}
export function Spinner() {
  return <LoaderCircle className="spin" size={17} aria-label="Loading" />;
}
export function ExternalLink({
  href,
  children,
}: {
  href?: string;
  children: ReactNode;
}) {
  const url = safeUrl(href);
  return url ? (
    <a
      className="external-link"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
      <ArrowUpRight size={15} />
    </a>
  ) : null;
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
      dialog?.close();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? "modal-wide" : ""}`}
      aria-label={title}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal-header">
        <h2>{title}</h2>
        <button className="icon-button" onClick={onClose} aria-label="Close">
          <X size={21} />
        </button>
      </div>
      <div className="modal-body">{children}</div>
    </dialog>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-heading">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <div className="heading-row">
        <h1>{title}</h1>
        {action}
      </div>
      {description && <p>{description}</p>}
    </header>
  );
}
export function Tag({ name }: { name: string }) {
  return (
    <Link
      className="tag"
      href={`/explore?category=${encodeURIComponent(name)}`}
    >
      {name.replace(/^#/, "")}
    </Link>
  );
}
