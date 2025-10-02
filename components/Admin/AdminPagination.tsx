"use client";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { Pagination } from "@nextui-org/pagination";

interface AdminPaginationProps {
  totalResults: number;
  limit: number;
  showControls?: boolean;
  isCompact?: boolean;
}

export default function AdminPagination({
  totalResults,
  limit,
  showControls = true,
  isCompact = false,
}: AdminPaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { replace } = useRouter();
  const currentPage = Number(searchParams.get("page")) || 1;

  const handlePageChange = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNumber.toString());
    replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const totalPages = Math.max(1, Math.ceil(totalResults / limit)); // Always show at least 1 page

  return (
    <div className="flex justify-center mt-6">
      <Pagination
        showControls={showControls}
        isCompact={isCompact}
        total={totalPages}
        page={currentPage}
        initialPage={1}
        onChange={handlePageChange}
      />
    </div>
  );
}