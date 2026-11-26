import { notFound } from "next/navigation";
import { AccessConsole } from "./AccessConsole";

export default function AccessPage() {
  if (process.env.NEXT_PUBLIC_AUTH_ACCESS_CONSOLE_ENABLED !== "true")
    notFound();
  return <AccessConsole />;
}
