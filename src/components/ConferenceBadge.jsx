import accBadge from "../assets/conference-badges/acc.png";
import americanBadge from "../assets/conference-badges/american.png";
import big12Badge from "../assets/conference-badges/big-12.png";
import bigEastBadge from "../assets/conference-badges/big-east.png";
import bigTenBadge from "../assets/conference-badges/big-ten.png";
import coastalBadge from "../assets/conference-badges/coastal.png";
import cusaBadge from "../assets/conference-badges/c-usa.png";
import ivyBadge from "../assets/conference-badges/ivy.png";
import macBadge from "../assets/conference-badges/mac.png";
import mountainWestBadge from "../assets/conference-badges/mountain-west.png";
import ovcBadge from "../assets/conference-badges/ovc.png";
import secBadge from "../assets/conference-badges/sec.png";
import sunBeltBadge from "../assets/conference-badges/sun-belt.png";
import westCoastBadge from "../assets/conference-badges/west-coast.png";

export const CONFERENCE_BADGES = {
  ACC: accBadge,
  American: americanBadge,
  "Big 12": big12Badge,
  "Big East": bigEastBadge,
  "Big Ten": bigTenBadge,
  Coastal: coastalBadge,
  "C-USA": cusaBadge,
  Ivy: ivyBadge,
  MAC: macBadge,
  "Mtn West": mountainWestBadge,
  "Mountain West": mountainWestBadge,
  OVC: ovcBadge,
  SEC: secBadge,
  "Sun Belt": sunBeltBadge,
  "West Coast": westCoastBadge,
};

export function getConferenceBadge(conference) {
  return CONFERENCE_BADGES[conference] || null;
}

export default function ConferenceBadge({
  conference,
  alt,
  className = "",
  size,
}) {
  const src = getConferenceBadge(conference);

  if (!src) return null;

  const style = size
    ? { width: size, height: size, objectFit: "contain" }
    : undefined;

  return (
    <img
      src={src}
      alt={alt || `${conference} conference badge`}
      className={className}
      style={style}
      loading="lazy"
    />
  );
}
