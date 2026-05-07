import { Helmet } from 'react-helmet';
import { useLocation } from 'react-router-dom';

const BASE_URL = 'https://workbee.space';
const DEFAULT_IMAGE = `${BASE_URL}/logo-192.png`;

export function PageMeta({ title, description, image }) {
  const { pathname } = useLocation();
  const url = `${BASE_URL}${pathname}`;
  const ogImage = image || DEFAULT_IMAGE;

  return (
    <Helmet>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={url} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:image" content={ogImage} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={title} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}
