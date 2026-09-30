export default function CairnMark({ size = 36 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <path d="M9 29.5c-1.5 0-2.5 1-2.5 2.5s1 2.5 2.5 2.5h22c1.5 0 2.5-1 2.5-2.5s-1-2.5-2.5-2.5H9Z" fill="currentColor" />
    <path d="M12.5 20.5c-1.5 0-2.5 1-2.5 2.5s1 2.5 2.5 2.5h15c1.5 0 2.5-1 2.5-2.5s-1-2.5-2.5-2.5h-15Z" fill="currentColor" opacity=".8" />
    <path d="m17.7 7.8-3.1 5.4c-.9 1.5.2 3.3 1.9 3.3h7c1.7 0 2.8-1.8 1.9-3.3l-3.1-5.4a2.65 2.65 0 0 0-4.6 0Z" fill="currentColor" />
  </svg>;
}
