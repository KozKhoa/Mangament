"use client";

import StatsCard from "@/components/cards/admin/stats-card";
import LineChart from "@/components/chart/line-chart";
import Loading from "@/components/loadings/loading";
import withAdmin from "@/hoc/withAdmin";

import adminService from "@/services/admin";
import { DashboardOverview, DashboardStatsNewUsers, DashboardStatsView } from "@/types/dashboard";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const testValue = [
  { key: "a", value: 10 },
  { key: "bcompo nents/loadin gs/loading loadings /loading loadings/ loading ", value: 20 },
  { key: "c", value: 110 },
  { key: "dcomponents/ loadings/loading", value: 40 },
  { key: "e", value: 20 },
  { key: "f", value: 30 },
  { key: "g components/loadings", value: 10 },
  { key: "h", value: 60 },
  { key: "i", value: 20 },
  { key: "g components/loadings", value: 10 },
  { key: "h", value: 90 },
  { key: "i", value: 190 },
  { key: "g components/loadings", value: 10 },
  { key: "h", value: 63 },
  { key: "i", value: 20 },
  { key: "g components/loadings", value: 10 },
  { key: "h", value: 60 },
  { key: "i", value: 20 },
  { key: "g components/loadings", value: 10 },
  { key: "h", value: 60 },
  { key: "i", value: 145 },
  { key: "g components/loadings", value: 10 },
  { key: "h", value: 60 },
  { key: "i", value: 20 },
  { key: "g components/loadings", value: 10 },
  { key: "h", value: 60 },
  { key: "i", value: 20 },
  { key: "g components/loadings", value: 10 },
  { key: "h", value: 60 },
  { key: "i", value: 145 },
  { key: "g components/loadings", value: 10 },
  { key: "h", value: 60 },
  { key: "i", value: 20 },
];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<DashboardOverview>();
  const [newUsesrStats, setNewUsesrStats] = useState<DashboardStatsNewUsers[]>([]);
  const [viewStats, setViewStats] = useState<DashboardStatsView[]>([]);

  const fetchOveriew = useCallback(async () => {
    setLoading(true);
    const res = await adminService.getOverview();
    setLoading(false);

    if (!res.success) return toast.warning(res.message);

    setOverview(res.data);
  }, []);

  useEffect(() => {
    fetchOveriew();
  }, []);

  return (
    <div className="relative">
      {loading ? (
        <Loading className=" h-[80vh]"></Loading>
      ) : (
        <div className=" flex flex-col gap-5">
          {/* General info */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <StatsCard
              label="Stories"
              value={overview?.totalStories}
              subLabel={`${overview?.totalStoriesBaseOnStatus["ongoing"]} ongoing`}
              icon={<img src="book.png"></img>}
            ></StatsCard>

            <StatsCard
              label="Users"
              value={overview?.totalUsers}
              subLabel={`${overview?.totalBannedUsers} banned users`}
              icon={<img src="user.png"></img>}
            ></StatsCard>

            <StatsCard label="Views" value={overview?.totalView} icon={<img src="reading.png"></img>} subLabel={`${overview?.totalRating} ratings`}></StatsCard>
          </div>

          {/* Stats view */}
          <div>
            <LineChart value={testValue} unit="views" className="h-[500px]"></LineChart>
          </div>

          <div className="w-full h-[50vh]"></div>
        </div>
      )}
    </div>
  );
}

// export default withAdmin(Dashboard);
