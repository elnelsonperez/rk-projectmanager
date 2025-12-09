import { Spinner } from '@/components/ui/spinner';

export default function Loading() {
  return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <Spinner size="lg" />
    </div>
  );
}
