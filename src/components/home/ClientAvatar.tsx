import { getCustomerAvatar, initialsFromName } from "../../app/lib/getCustomerAvatar";
import styles from "../../app/page.module.css";

/**
 * ClientAvatar — renders either a customer image or styled initials.
 *
 * Props:
 *   name       – customer / appointment client name
 *   className  – CSS class for sizing/styling
 *   imageUrl   – optional image URL (avatarManualUrl or avatarWhatsappUrl)
 *   phone      – optional phone, used as seed when name is generic
 */
export default function ClientAvatar({
  name,
  className,
  imageUrl,
  phone,
}: {
  name: string;
  className: string;
  imageUrl?: string | null;
  phone?: string | null;
}) {
  // If an image URL is provided, render <img>
  if (imageUrl) {
    return (
      <div aria-label={name} className={className} role="img">
        <img
          src={imageUrl}
          alt={name}
          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }}
        />
      </div>
    );
  }

  // Fallback to initials
  const label = name || phone || "CL";
  const initials = initialsFromName(label);

  return (
    <div aria-label={name} className={className} role="img">
      {initials}
    </div>
  );
}
