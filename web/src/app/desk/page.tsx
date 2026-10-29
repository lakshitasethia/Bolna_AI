import type { Metadata } from "next";
import Desk from "./Desk";

export const metadata: Metadata = {
  title: "Desk · Bhaada",
  description: "Post a load and watch Bhaada call truck owners.",
};

export default function DeskPage() {
  return <Desk />;
}
