import { Suspense } from 'react';
import ConsentPage from './';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ConsentPage />
    </Suspense>
  );
}