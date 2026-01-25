"use client";

import withAdmin from "@/hoc/withAdmin";
import useResize from "@/hooks/useResize";

export default function Dashboard() {
  const refResize = useResize({ resizeRight: true });
  return <div></div>;
}

// export default withAdmin(Dashboard);
