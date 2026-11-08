import { House } from "lucide-react";
import Layout from "@/layouts/Layout";
import { IconLink } from "@/components/IconLink";

export default function NotFound() {
  return (
    <Layout>
      <main className="home enter">
        <p>
          <IconLink isInternal={true} href="/" icon={<House />}>
            Back home
          </IconLink>
        </p>
      </main>
    </Layout>
  );
}
