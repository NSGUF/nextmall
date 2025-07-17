import { redirect } from "next/navigation";

export default function Home() {
  const homePath = process.env.NEXT_PUBLIC_DEFAULT_HOME_PATH ?? "/h5";
  redirect(homePath);
  return null;
}