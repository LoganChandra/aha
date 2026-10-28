import { notFound } from 'next/navigation';
import Gallery from './Gallery';

// Development only: renders bake-off lessons for screenshot checks.
export default function Page() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <Gallery />;
}
