import type { Metadata } from "next";
import ListView from "@/components/user/ListView";

export const metadata: Metadata = { title: "My list" };

export default function ListPage() {
  return <ListView />;
}
