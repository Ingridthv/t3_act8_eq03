import { useState } from 'react';

export default function Avatar({ src, fallbackSrc, initials = '', size = 'md', alt = '' }) {
  const [failed, setFailed] = useState(false);
  const [fallbackFailed, setFallbackFailed] = useState(false);

  const currentSrc = !src || failed ? (fallbackFailed ? null : fallbackSrc) : src;

  if (!currentSrc) {
    return (
      <span className={`avatar avatar--${size} avatar--initials`} aria-hidden={alt ? undefined : 'true'}>
        {initials}
      </span>
    );
  }
  return (
    <img
      className={`avatar avatar--${size}`}
      src={currentSrc}
      alt={alt}
      onError={() => (currentSrc === src ? setFailed(true) : setFallbackFailed(true))}
      loading="lazy"
    />
  );
}