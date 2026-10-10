interface Props {
  icon: string;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Warm first-run empty state: an emoji, a friendly sentence about
 * what the screen is for, and the primary action button.
 */
export default function EmptyState({ icon, title, body, actionLabel, onAction }: Props) {
  return (
    <div className="empty-state">
      <div className="empty-icon" aria-hidden="true">
        {icon}
      </div>
      <h3>{title}</h3>
      <p>{body}</p>
      {actionLabel && onAction && (
        <button type="button" className="btn" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
