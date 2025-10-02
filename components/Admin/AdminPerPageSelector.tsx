"use client";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { Select, SelectItem } from "@nextui-org/select";
import { Selection } from "@react-types/shared";

export default function AdminPerPageSelector() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  function handlePerPageChange(selection: Selection) {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1"); // Reset to first page when changing per page
    params.set("limit", Array.from(selection)[0].toString());
    replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const currentLimit = searchParams.get("limit") || "10";
  const selectedKeys = new Set([currentLimit]);

  return (
    <Select
      label="Per Page"
      size="sm"
      onSelectionChange={handlePerPageChange}
      selectedKeys={selectedKeys}
      className="w-24 shrink-0"
    >
      <SelectItem key="5" value={5}>
        5
      </SelectItem>
      <SelectItem key="10" value={10}>
        10
      </SelectItem>
      <SelectItem key="15" value={15}>
        15
      </SelectItem>
      <SelectItem key="20" value={20}>
        20
      </SelectItem>
      <SelectItem key="25" value={25}>
        25
      </SelectItem>
    </Select>
  );
}