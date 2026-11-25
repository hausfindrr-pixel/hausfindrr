/**
 * Lightweight contextual help box.
 * Pass a guide object { title?, body } or use the `guideKey` prop to
 * pull directly from the GUIDES config.
 */
import GUIDES from '../../constants/guides';

export default function GuideBox({ guideKey, title, body, className = '' }) {
  const guide = guideKey ? GUIDES[guideKey] : { title, body };
  if (!guide?.body) return null;

  return (
    <div className={`rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-800 ${className}`}>
      {guide.title && <p className="font-semibold mb-1">{guide.title}</p>}
      <p className="leading-relaxed">{guide.body}</p>
    </div>
  );
}
